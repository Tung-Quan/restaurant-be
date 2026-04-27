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

import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, In, Repository } from 'typeorm';
import { ConfigService } from '@nestjs/config';
import { Order } from '../../entities/order.entity.js';
import { OrderItem } from '../../entities/order-item.entity.js';
import { MenuItem } from '../../entities/menu-item.entity.js';
import { OrderStatus, PaymentStatus } from '../../common/enums/index.js';
import { CreateOrderDto } from './dto/order.dto.js';
import {
  InternalEventBusService,
  INTERNAL_EVENTS,
  OrderCreatedForKdsEvent,
  OrderStatusUpdatedEvent,
  OutboxEventService,
} from '../../common/events/index.js';
import { ActivityLogService } from '../admin/activity-log.service.js';

@Injectable()
export class OrdersService {
  constructor(
    @InjectRepository(Order)
    private readonly orderRepository: Repository<Order>,
    @InjectRepository(OrderItem)
    private readonly orderItemRepository: Repository<OrderItem>,
    @InjectRepository(MenuItem)
    private readonly menuItemRepository: Repository<MenuItem>,
    private readonly dataSource: DataSource,
    private readonly configService: ConfigService,
    private readonly eventBus: InternalEventBusService,
    private readonly outboxEventService: OutboxEventService,
    private readonly activityLogService: ActivityLogService,
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
      if (includes.includes('table')) {
        qb.leftJoinAndSelect('order.table', 'table');
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
    const taxRate = this.configService.get<number>('TAX_RATE', 10) / 100;
    const menuItemIds = dto.items.map((item) => item.menu_item_id);
    const menuItems = await this.menuItemRepository.find({
      where: { id: In(menuItemIds) },
    });
    const menuItemById = new Map(menuItems.map((item) => [item.id, item]));

    for (const requestedItem of dto.items) {
      const menuItem = menuItemById.get(requestedItem.menu_item_id);
      if (!menuItem) {
        throw new BadRequestException(
          `Menu item ${requestedItem.menu_item_id} was not found`,
        );
      }
      if (!menuItem.isAvailable) {
        throw new BadRequestException(`${menuItem.name} is currently unavailable`);
      }
    }

    const subtotal = dto.items.reduce(
      (sum, item) =>
        sum + Number(menuItemById.get(item.menu_item_id)?.price ?? 0) * item.quantity,
      0,
    );
    const tax = Math.round(subtotal * taxRate * 100) / 100;
    const totalAmount = subtotal + tax;

    const { savedOrder, outboxEventId } = await this.dataSource.transaction(
      async (manager) => {
        const order = manager.create(Order, {
          tableId: dto.table_id,
          serverId: serverId || null,
          orderType: dto.order_type || 'dine_in',
          specialInstructions: dto.special_instructions || null,
          subtotal,
          tax,
          totalAmount,
          status: OrderStatus.PENDING,
          paymentStatus: PaymentStatus.UNPAID,
          items: dto.items.map((item) =>
            manager.create(OrderItem, {
              menuItemId: item.menu_item_id,
              quantity: item.quantity,
              unitPrice: Number(menuItemById.get(item.menu_item_id)?.price ?? 0),
              notes: item.notes || null,
              customizations: item.customizations || null,
            }),
          ),
        });

        const nextSavedOrder = await manager.save(Order, order);
        const eventPayload: OrderCreatedForKdsEvent = {
          order_id: nextSavedOrder.id,
          table_id: nextSavedOrder.tableId,
          server_id: nextSavedOrder.serverId,
          created_at: nextSavedOrder.createdAt,
          items: nextSavedOrder.items.map((item) => ({
            order_item_id: item.id,
            menu_item_id: item.menuItemId,
            quantity: item.quantity,
            notes: item.notes,
          })),
        };
        const outboxEvent = await this.outboxEventService.createPending(
          manager,
          INTERNAL_EVENTS.ORDER_CREATED_FOR_KDS,
          eventPayload as unknown as Record<string, unknown>,
        );

        return { savedOrder: nextSavedOrder, outboxEventId: outboxEvent.id };
      },
    );

    await this.outboxEventService.publishById(outboxEventId);

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

  async updateStatus(id: string, status: OrderStatus) {
    const order = await this.orderRepository.findOne({ where: { id } });
    if (!order) {
      throw new NotFoundException('Order not found');
    }

    order.status = status;
    const savedOrder = await this.orderRepository.save(order);

    const eventPayload: OrderStatusUpdatedEvent = {
      order_id: savedOrder.id,
      status: savedOrder.status,
      updated_at: savedOrder.updatedAt,
    };
    await this.outboxEventService.recordAndPublish(
      INTERNAL_EVENTS.ORDER_STATUS_UPDATED,
      eventPayload as unknown as Record<string, unknown>,
    );

    return {
      id: savedOrder.id,
      status: savedOrder.status,
      payment_status: savedOrder.paymentStatus,
      updated_at: savedOrder.updatedAt,
    };
  }

  async cancel(id: string, userId?: string) {
    const order = await this.orderRepository.findOne({ where: { id } });
    if (!order) {
      throw new NotFoundException('Order not found');
    }

    if (order.paymentStatus === PaymentStatus.PAID) {
      throw new BadRequestException('Paid orders cannot be cancelled');
    }

    if ([OrderStatus.COMPLETED, OrderStatus.CANCELLED].includes(order.status)) {
      throw new BadRequestException(`Order is already ${order.status}`);
    }

    order.status = OrderStatus.CANCELLED;
    const savedOrder = await this.orderRepository.save(order);

    const eventPayload: OrderStatusUpdatedEvent = {
      order_id: savedOrder.id,
      status: savedOrder.status,
      updated_at: savedOrder.updatedAt,
    };
    await this.outboxEventService.recordAndPublish(
      INTERNAL_EVENTS.ORDER_STATUS_UPDATED,
      eventPayload as unknown as Record<string, unknown>,
    );

    await this.activityLogService.log(
      userId ?? '',
      'CANCEL_ORDER',
      'orders',
      savedOrder.id,
      { status: savedOrder.status },
    );

    return {
      id: savedOrder.id,
      status: savedOrder.status,
      payment_status: savedOrder.paymentStatus,
      updated_at: savedOrder.updatedAt,
    };
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
      order_type: order.orderType,
      status: order.status,
      special_instructions: order.specialInstructions,
      subtotal: Number(order.subtotal),
      tax: Number(order.tax),
      discount: Number(order.discount),
      tip_amount: Number(order.tipAmount),
      promotion_code: order.promotionCode,
      total_amount: Number(order.totalAmount),
      payment_status: order.paymentStatus,
      payment_method: order.paymentMethod,
      created_at: order.createdAt,
      table: order.table
        ? {
            id: order.table.id,
            table_number: order.table.tableNumber,
          }
        : null,
      items: order.items?.map((item) => ({
        id: item.id,
        menu_item_id: item.menuItemId,
        menu_item_name: item.menuItem?.name || null,
        quantity: item.quantity,
        unit_price: Number(item.unitPrice),
        status: item.status,
        notes: item.notes,
        customizations: item.customizations,
      })),
    };
  }
}
