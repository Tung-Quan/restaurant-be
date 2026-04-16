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

import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Repository } from 'typeorm';
import { Order } from '../../entities/order.entity.js';
import { OrderItem } from '../../entities/order-item.entity.js';
import { OrderStatus, OrderItemStatus } from '../../common/enums/index.js';

@Injectable()
export class KitchenService {
  constructor(
    @InjectRepository(Order)
    private readonly orderRepository: Repository<Order>,
    @InjectRepository(OrderItem)
    private readonly orderItemRepository: Repository<OrderItem>,
  ) {}

  async getKitchenOrders(statusFilter?: string) {
    const statuses = statusFilter
      ? statusFilter.split(',')
      : [OrderStatus.PENDING, OrderStatus.IN_PROGRESS];

    const orders = await this.orderRepository.find({
      where: { status: In(statuses as OrderStatus[]) },
      relations: ['items', 'items.menuItem'],
      order: { createdAt: 'ASC' },
    });

    return orders.map((order) => ({
      id: order.id,
      created_at: order.createdAt,
      special_instructions: order.specialInstructions,
      items: order.items?.map((item) => ({
        id: item.id,
        quantity: item.quantity,
        status: item.status,
        notes: item.notes,
        menu_item: item.menuItem
          ? {
              name: item.menuItem.name,
              prep_time_minutes: item.menuItem.prepTimeMinutes,
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
