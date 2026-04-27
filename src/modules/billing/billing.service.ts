/**
 * Billing Service.
 *
 * SOLID: Single Responsibility Principle (SRP)
 * - Handles billing and payment business logic only.
 *
 * SOLID: Interface Segregation Principle (ISP)
 * - Billing service provides only payment-related operations,
 *   not full order management.
 *
 * SOLID: Dependency Inversion Principle (DIP)
 * - Depends on Repository abstractions.
 */

import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Repository } from 'typeorm';
import { Order } from '../../entities/order.entity.js';
import { OrderStatus, PaymentStatus } from '../../common/enums/index.js';
import { CreatePaymentDto, SplitBillDto } from './dto/billing.dto.js';
import { ActivityLogService } from '../admin/activity-log.service.js';

export interface SplitBillShare {
  party_name: string;
  item_ids?: string[];
  subtotal: number;
  tax: number;
  discount: number;
  total_amount: number;
}

export interface SplitBillResult {
  mode: 'even' | 'items';
  shares: SplitBillShare[];
  total_amount: number;
  created_at: Date;
}

@Injectable()
export class BillingService {
  constructor(
    @InjectRepository(Order)
    private readonly orderRepository: Repository<Order>,
    private readonly activityLogService: ActivityLogService,
  ) {}

  async getBillableOrders(statusFilter?: string) {
    const statuses = statusFilter
      ? (statusFilter.split(',') as OrderStatus[])
      : [OrderStatus.READY, OrderStatus.SERVED, OrderStatus.COMPLETED];

    const orders = await this.orderRepository.find({
      where: { status: In(statuses) },
      relations: ['items', 'items.menuItem', 'table'],
      order: { createdAt: 'DESC' },
    });

    return orders.map((order) => ({
      id: order.id,
      table_id: order.tableId,
      subtotal: Number(order.subtotal),
      tax: Number(order.tax),
      discount: Number(order.discount),
      tip_amount: Number(order.tipAmount),
      promotion_code: order.promotionCode,
      total_amount: Number(order.totalAmount),
      payment_status: order.paymentStatus,
      payment_method: order.paymentMethod,
      split_bill: order.splitBill,
      status: order.status,
      items: order.items?.map((item) => ({
        id: item.id,
        quantity: item.quantity,
        unit_price: Number(item.unitPrice),
        menu_item_name: item.menuItem?.name || null,
      })),
    }));
  }

  async processPayment(orderId: string, dto: CreatePaymentDto, userId?: string) {
    const order = await this.orderRepository.findOne({
      where: { id: orderId },
    });

    if (!order) {
      throw new NotFoundException('Order not found');
    }

    if (order.paymentStatus === PaymentStatus.PAID) {
      throw new BadRequestException('Order is already paid');
    }

    const tipAmount = this.roundCurrency(dto.tip_amount ?? 0);
    const promotion = this.calculatePromotionDiscount(order, dto.promotion_code);
    const payableTotal = this.roundCurrency(
      Number(order.subtotal) + Number(order.tax) - promotion.discount + tipAmount,
    );

    if (dto.amount < payableTotal) {
      throw new BadRequestException('Payment amount is less than order total');
    }

    order.discount = promotion.discount;
    order.tipAmount = tipAmount;
    order.promotionCode = promotion.code;
    order.totalAmount = payableTotal;
    order.paymentStatus = PaymentStatus.PAID;
    order.paymentMethod = dto.method;
    order.status = OrderStatus.COMPLETED;
    order.paidAt = new Date();

    const savedOrder = await this.orderRepository.save(order);

    await this.activityLogService.log(
      userId ?? '',
      'PROCESS_PAYMENT',
      'orders',
      savedOrder.id,
      {
        method: savedOrder.paymentMethod,
        amount: dto.amount,
        total_amount: Number(savedOrder.totalAmount),
        tip_amount: Number(savedOrder.tipAmount),
        promotion_code: savedOrder.promotionCode,
      },
    );

    return {
      order_id: savedOrder.id,
      payment_status: savedOrder.paymentStatus,
      payment_method: savedOrder.paymentMethod,
      status: savedOrder.status,
      paid_at: savedOrder.paidAt,
      discount: Number(savedOrder.discount),
      tip_amount: Number(savedOrder.tipAmount),
      promotion_code: savedOrder.promotionCode,
      total_amount: Number(savedOrder.totalAmount),
    };
  }

  async splitBill(orderId: string, dto: SplitBillDto) {
    const order = await this.orderRepository.findOne({
      where: { id: orderId },
      relations: ['items', 'items.menuItem'],
    });

    if (!order) {
      throw new NotFoundException('Order not found');
    }

    if (!order.items || order.items.length === 0) {
      throw new BadRequestException('Order has no items to split');
    }

    const splitBill =
      dto.mode === 'even'
        ? this.calculateEvenSplit(order, dto)
        : this.calculateItemSplit(order, dto);

    order.splitBill = splitBill as unknown as Record<string, unknown>;
    await this.orderRepository.save(order);

    return {
      order_id: order.id,
      split_bill: splitBill,
    };
  }

  async getTodayRevenue(): Promise<number> {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const result = await this.orderRepository
      .createQueryBuilder('order')
      .select('COALESCE(SUM(order.totalAmount), 0)', 'revenue')
      .where('order.paymentStatus = :status', { status: PaymentStatus.PAID })
      .andWhere('order.paidAt >= :today', { today })
      .getRawOne<{ revenue: string }>();

    return parseFloat(result?.revenue ?? '0');
  }

  private calculateEvenSplit(order: Order, dto: SplitBillDto): SplitBillResult {
    const guestCount = dto.guest_count;
    if (!guestCount) {
      throw new BadRequestException('guest_count is required for even splits');
    }

    const subtotal = Number(order.subtotal);
    const tax = Number(order.tax);
    const discount = Number(order.discount);
    const totalAmount = Number(order.totalAmount);

    const shares = Array.from({ length: guestCount }).map((_, index) => ({
      party_name: `Guest ${index + 1}`,
      subtotal: this.roundCurrency(subtotal / guestCount),
      tax: this.roundCurrency(tax / guestCount),
      discount: this.roundCurrency(discount / guestCount),
      total_amount: this.roundCurrency(totalAmount / guestCount),
    }));

    this.adjustRounding(shares, totalAmount);

    return {
      mode: 'even',
      shares,
      total_amount: totalAmount,
      created_at: new Date(),
    };
  }

  private calculateItemSplit(order: Order, dto: SplitBillDto): SplitBillResult {
    const parties = dto.parties ?? [];
    if (parties.length < 2) {
      throw new BadRequestException('At least two parties are required');
    }

    const orderItemIds = new Set(order.items.map((item) => item.id));
    const assignedItemIds = new Set<string>();

    for (const party of parties) {
      if (party.item_ids.length === 0) {
        throw new BadRequestException('Each party must have at least one item');
      }

      for (const itemId of party.item_ids) {
        if (!orderItemIds.has(itemId)) {
          throw new BadRequestException(`Item ${itemId} does not belong to order`);
        }
        if (assignedItemIds.has(itemId)) {
          throw new BadRequestException(`Item ${itemId} is assigned more than once`);
        }
        assignedItemIds.add(itemId);
      }
    }

    if (assignedItemIds.size !== orderItemIds.size) {
      throw new BadRequestException('Every order item must be assigned exactly once');
    }

    const orderSubtotal = Number(order.subtotal);
    const orderTax = Number(order.tax);
    const orderDiscount = Number(order.discount);
    const totalAmount = Number(order.totalAmount);

    const shares = parties.map((party) => {
      const partyItems = order.items.filter((item) =>
        party.item_ids.includes(item.id),
      );
      const subtotal = partyItems.reduce(
        (sum, item) => sum + Number(item.unitPrice) * item.quantity,
        0,
      );
      const ratio = orderSubtotal > 0 ? subtotal / orderSubtotal : 0;
      const tax = this.roundCurrency(orderTax * ratio);
      const discount = this.roundCurrency(orderDiscount * ratio);

      return {
        party_name: party.party_name,
        item_ids: party.item_ids,
        subtotal: this.roundCurrency(subtotal),
        tax,
        discount,
        total_amount: this.roundCurrency(subtotal + tax - discount),
      };
    });

    this.adjustRounding(shares, totalAmount);

    return {
      mode: 'items',
      shares,
      total_amount: totalAmount,
      created_at: new Date(),
    };
  }

  private roundCurrency(value: number): number {
    return Math.round(value * 100) / 100;
  }

  private calculatePromotionDiscount(
    order: Order,
    promotionCode?: string,
  ): { code: string | null; discount: number } {
    const code = promotionCode?.trim().toUpperCase();
    if (!code) {
      return { code: null, discount: Number(order.discount) || 0 };
    }

    const subtotal = Number(order.subtotal);
    const subtotalWithTax = subtotal + Number(order.tax);

    if (code === 'SAVE10') {
      return { code, discount: this.roundCurrency(subtotal * 0.1) };
    }

    if (code === 'SAVE5') {
      return { code, discount: Math.min(5, subtotalWithTax) };
    }

    throw new BadRequestException('Unsupported promotion code');
  }

  private adjustRounding(shares: SplitBillShare[], expectedTotal: number): void {
    if (shares.length === 0) return;

    const currentTotal = shares.reduce(
      (sum, share) => sum + share.total_amount,
      0,
    );
    const delta = this.roundCurrency(expectedTotal - currentTotal);

    if (delta !== 0) {
      const lastShare = shares[shares.length - 1];
      lastShare.total_amount = this.roundCurrency(lastShare.total_amount + delta);
    }
  }
}
