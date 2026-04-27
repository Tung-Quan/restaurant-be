/**
 * Kitchen Service.
 *
 * SOLID: Single Responsibility Principle (SRP)
 * - Handles kitchen-specific business logic: viewing orders for kitchen, updating item status.
 *
 * SOLID: Interface Segregation Principle (ISP)
 * - Kitchen service only exposes what kitchen staff needs, not full order management.
 *
 * SOLID: Dependency Inversion Principle (DIP)
 * - Depends on Repository abstractions.
 */

import { Injectable, NotFoundException, OnModuleInit } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Repository } from 'typeorm';
import { Order } from '../../entities/order.entity.js';
import { OrderItem } from '../../entities/order-item.entity.js';
import { OrderStatus, OrderItemStatus } from '../../common/enums/index.js';
import {
  InternalEventBusService,
  INTERNAL_EVENTS,
  KdsOrderNotification,
  OrderCreatedForKdsEvent,
} from '../../common/events/index.js';

@Injectable()
export class KitchenService implements OnModuleInit {
  private readonly recentNotifications: KdsOrderNotification[] = [];

  constructor(
    @InjectRepository(Order)
    private readonly orderRepository: Repository<Order>,
    @InjectRepository(OrderItem)
    private readonly orderItemRepository: Repository<OrderItem>,
    private readonly eventBus: InternalEventBusService,
  ) {}

  onModuleInit(): void {
    this.eventBus.subscribe<OrderCreatedForKdsEvent>(
      INTERNAL_EVENTS.ORDER_CREATED_FOR_KDS,
      (event) => this.handleOrderCreatedForKds(event),
    );
  }

  async getKitchenOrders(statusFilter?: string) {
    const statuses = statusFilter
      ? statusFilter.split(',')
      : [OrderStatus.PENDING, OrderStatus.IN_PROGRESS];

    const orders = await this.orderRepository.find({
      where: { status: In(statuses as OrderStatus[]) },
      relations: ['items', 'items.menuItem', 'items.menuItem.category'],
      order: { createdAt: 'ASC' },
    });

    return orders.map((order) => ({
      id: order.id,
      created_at: order.createdAt,
      deadline_at: this.getOrderDeadline(order),
      visual_alert: this.getVisualAlert(order),
      special_instructions: order.specialInstructions,
      items: order.items?.map((item) => ({
        id: item.id,
        quantity: item.quantity,
        status: item.status,
        notes: item.notes,
        station: item.menuItem?.category?.name ?? 'General',
        deadline_at: this.getItemDeadline(order.createdAt, item),
        menu_item: item.menuItem
          ? {
              name: item.menuItem.name,
              prep_time_minutes: item.menuItem.prepTimeMinutes,
              category: item.menuItem.category?.name ?? null,
            }
          : null,
      })),
    }));
  }

  async updateOrderItemStatus(id: string, status: OrderItemStatus) {
    const item = await this.orderItemRepository.findOne({
      where: { id },
      relations: ['order', 'order.items'],
    });

    if (!item) {
      throw new NotFoundException('Order item not found');
    }

    item.status = status;
    const savedItem = await this.orderItemRepository.save(item);

    // Auto-update order status based on item statuses
    await this.syncOrderStatus(item.orderId);

    return {
      id: savedItem.id,
      status: savedItem.status,
      updated_at: new Date(),
    };
  }

  getRecentNotifications() {
    return this.recentNotifications;
  }

  private handleOrderCreatedForKds(event: OrderCreatedForKdsEvent): void {
    this.recentNotifications.unshift({
      ...event,
      received_at: new Date(),
    });

    if (this.recentNotifications.length > 25) {
      this.recentNotifications.length = 25;
    }
  }

  private getOrderDeadline(order: Order): Date {
    const maxPrepTime = Math.max(
      0,
      ...(order.items ?? []).map((item) => item.menuItem?.prepTimeMinutes ?? 0),
    );
    return this.addMinutes(order.createdAt, maxPrepTime);
  }

  private getItemDeadline(orderCreatedAt: Date, item: OrderItem): Date {
    return this.addMinutes(orderCreatedAt, item.menuItem?.prepTimeMinutes ?? 0);
  }

  private getVisualAlert(order: Order): 'new' | 'on_track' | 'due_soon' | 'overdue' {
    const ageMs = Date.now() - order.createdAt.getTime();
    if (ageMs < 60_000) {
      return 'new';
    }

    const deadline = this.getOrderDeadline(order);
    const minutesUntilDeadline = (deadline.getTime() - Date.now()) / 60_000;
    if (minutesUntilDeadline < 0) {
      return 'overdue';
    }
    if (minutesUntilDeadline <= 5) {
      return 'due_soon';
    }
    return 'on_track';
  }

  private addMinutes(date: Date, minutes: number): Date {
    return new Date(date.getTime() + minutes * 60_000);
  }

  /**
   * Automatically updates the parent order's status based on
   * the aggregate status of its items.
   */
  private async syncOrderStatus(orderId: string): Promise<void> {
    const order = await this.orderRepository.findOne({
      where: { id: orderId },
      relations: ['items'],
    });

    if (!order) return;

    const itemStatuses = order.items.map((i) => i.status);

    if (itemStatuses.every((s) => s === OrderItemStatus.SERVED)) {
      order.status = OrderStatus.SERVED;
    } else if (itemStatuses.every((s) => s === OrderItemStatus.READY)) {
      order.status = OrderStatus.READY;
    } else if (
      itemStatuses.some(
        (s) => s === OrderItemStatus.COOKING || s === OrderItemStatus.PREPARING,
      )
    ) {
      order.status = OrderStatus.IN_PROGRESS;
    }

    await this.orderRepository.save(order);
  }
}
