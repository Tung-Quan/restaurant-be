/**
 * Orders Service.
 *
 * SOLID: Single Responsibility Principle (SRP)
 * - Handles order business logic: creation, retrieval, calculations.
 *
 * SOLID: Dependency Inversion Principle (DIP)
 * - Depends on Repository abstractions and ConfigService.
 *
 * SOLID: Open/Closed Principle (OCP)
 * - Tax calculation uses configurable TAX_RATE; new tax strategies could be
 *   introduced via a TaxCalculator interface without modifying this service.
 */

import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Repository } from 'typeorm';
import { ConfigService } from '@nestjs/config';
import { Order } from '../../entities/order.entity.js';
import { OrderItem } from '../../entities/order-item.entity.js';
import { OrderStatus, PaymentStatus } from '../../common/enums/index.js';
import { CreateOrderDto } from './dto/order.dto.js';

@Injectable()
export class OrdersService {
  constructor(
    @InjectRepository(Order)
    private readonly orderRepository: Repository<Order>,
    @InjectRepository(OrderItem)
    private readonly orderItemRepository: Repository<OrderItem>,
    private readonly configService: ConfigService,
  ) {}

  async findAll(query: {
    include?: string;
    limit?: number;
    sort?: string;
    status?: string;
  }) {
    const qb = this.orderRepository.createQueryBuilder('order');

    // Handle includes
    if (query.include) {
      const includes = query.include.split(',');
      if (includes.includes('items') || includes.includes('items.menu_item')) {
        qb.leftJoinAndSelect('order.items', 'items');
        if (includes.includes('items.menu_item')) {
          qb.leftJoinAndSelect('items.menuItem', 'menuItem');
        }
      }
    }

    // Handle status filter
    if (query.status) {
      const statuses = query.status.split(',');
      qb.andWhere('order.status IN (:...statuses)', { statuses });
    }

    // Handle sorting
    if (query.sort) {
      const desc = query.sort.startsWith('-');
      const field = query.sort.replace(/^-/, '');
      const columnMap: Record<string, string> = {
        created_at: 'order.createdAt',
      };
      const column = columnMap[field] || `order.${field}`;
      qb.orderBy(column, desc ? 'DESC' : 'ASC');
    } else {
      qb.orderBy('order.createdAt', 'DESC');
    }

    // Handle limit
    if (query.limit) {
      qb.take(query.limit);
    }

    const orders = await qb.getMany();

    // Transform to match API contract
    return orders.map((order) => this.transformOrder(order));
  }

  async create(dto: CreateOrderDto, serverId?: string) {
    const taxRate =
      this.configService.get<number>('TAX_RATE', 10) / 100;

    const subtotal = dto.items.reduce(
      (sum, item) => sum + item.unit_price * item.quantity,
      0,
    );
    const tax = Math.round(subtotal * taxRate * 100) / 100;
    const totalAmount = subtotal + tax;

    const order = this.orderRepository.create({
      tableId: dto.table_id,
      serverId: serverId || null,
      specialInstructions: dto.special_instructions || null,
      subtotal,
      tax,
      totalAmount,
      status: OrderStatus.PENDING,
      paymentStatus: PaymentStatus.UNPAID,
      items: dto.items.map((item) =>
        this.orderItemRepository.create({
          menuItemId: item.menu_item_id,
          quantity: item.quantity,
          unitPrice: item.unit_price,
          notes: item.notes || null,
        }),
      ),
    });

    const savedOrder = await this.orderRepository.save(order);

    return {
      id: savedOrder.id,
      status: savedOrder.status,
      subtotal: savedOrder.subtotal,
      tax: savedOrder.tax,
      total_amount: savedOrder.totalAmount,
    };
  }

  async findById(id: string): Promise<Order> {
    const order = await this.orderRepository.findOne({
      where: { id },
      relations: ['items', 'items.menuItem'],
    });
    if (!order) {
      throw new NotFoundException('Order not found');
    }
    return order;
  }

  async countByStatus(statuses?: OrderStatus[]): Promise<number> {
    if (statuses && statuses.length > 0) {
      return this.orderRepository.count({
        where: { status: In(statuses) },
      });
    }
    return this.orderRepository.count();
  }

  async countTodayOrders(): Promise<number> {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return this.orderRepository
      .createQueryBuilder('order')
      .where('order.createdAt >= :today', { today })
      .getCount();
  }

  private transformOrder(order: Order) {
    return {
      id: order.id,
      table_id: order.tableId,
      server_id: order.serverId,
      status: order.status,
      special_instructions: order.specialInstructions,
      subtotal: Number(order.subtotal),
      tax: Number(order.tax),
      discount: Number(order.discount),
      total_amount: Number(order.totalAmount),
      payment_status: order.paymentStatus,
      payment_method: order.paymentMethod,
      created_at: order.createdAt,
      items: order.items?.map((item) => ({
        id: item.id,
        menu_item_id: item.menuItemId,
        menu_item_name: item.menuItem?.name || null,
        quantity: item.quantity,
        unit_price: Number(item.unitPrice),
        status: item.status,
        notes: item.notes,
      })),
    };
  }
}
