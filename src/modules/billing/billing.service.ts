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
import {
  OrderStatus,
  PaymentStatus,
} from '../../common/enums/index.js';
import { CreatePaymentDto } from './dto/billing.dto.js';

@Injectable()
export class BillingService {
  constructor(
    @InjectRepository(Order)
    private readonly orderRepository: Repository<Order>,
  ) {}

  async getBillableOrders(statusFilter?: string) {
    const statuses = statusFilter
      ? (statusFilter.split(',') as OrderStatus[])
      : [OrderStatus.READY, OrderStatus.SERVED, OrderStatus.COMPLETED];

    const orders = await this.orderRepository.find({
      where: { status: In(statuses) },
      relations: ['items', 'items.menuItem'],
      order: { createdAt: 'DESC' },
    });

    return orders.map((order) => ({
      id: order.id,
      subtotal: Number(order.subtotal),
      tax: Number(order.tax),
      discount: Number(order.discount),
      total_amount: Number(order.totalAmount),
      payment_status: order.paymentStatus,
      payment_method: order.paymentMethod,
      status: order.status,
      items: order.items?.map((item) => ({
        quantity: item.quantity,
        unit_price: Number(item.unitPrice),
        menu_item_name: item.menuItem?.name || null,
      })),
    }));
  }

  async processPayment(orderId: string, dto: CreatePaymentDto) {
    const order = await this.orderRepository.findOne({
      where: { id: orderId },
    });

    if (!order) {
      throw new NotFoundException('Order not found');
    }

    if (order.paymentStatus === PaymentStatus.PAID) {
      throw new BadRequestException('Order is already paid');
    }

    order.paymentStatus = PaymentStatus.PAID;
    order.paymentMethod = dto.method;
    order.status = OrderStatus.COMPLETED;

    await this.orderRepository.save(order);

    return {
      order_id: order.id,
      payment_status: order.paymentStatus,
      payment_method: order.paymentMethod,
      status: order.status,
      paid_at: order.updatedAt,
    };
  }

  async getTodayRevenue(): Promise<number> {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const result = await this.orderRepository
      .createQueryBuilder('order')
      .select('COALESCE(SUM(order.totalAmount), 0)', 'revenue')
      .where('order.paymentStatus = :status', { status: PaymentStatus.PAID })
      .andWhere('order.updatedAt >= :today', { today })
      .getRawOne();

    return parseFloat(result?.revenue || '0');
  }
}
