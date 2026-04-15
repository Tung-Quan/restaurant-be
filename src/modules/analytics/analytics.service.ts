/**
 * Analytics Service.
 *
 * SOLID: Single Responsibility Principle (SRP)
 * - Handles analytics and reporting business logic only.
 *
 * SOLID: Dependency Inversion Principle (DIP)
 * - Depends on Repository abstractions.
 */

import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Order } from '../../entities/order.entity.js';
import { OrderItem } from '../../entities/order-item.entity.js';
import { PaymentStatus } from '../../common/enums/index.js';

@Injectable()
export class AnalyticsService {
  constructor(
    @InjectRepository(Order)
    private readonly orderRepository: Repository<Order>,
    @InjectRepository(OrderItem)
    private readonly orderItemRepository: Repository<OrderItem>,
  ) {}

  async getOrdersByStatus() {
    const results = await this.orderRepository
      .createQueryBuilder('order')
      .select('order.status', 'name')
      .addSelect('COUNT(*)', 'count')
      .groupBy('order.status')
      .getRawMany();

    return results.map((r: { name: string; count: string }) => ({
      name: r.name,
      count: parseInt(r.count, 10),
    }));
  }

  async getTopItems(limit: number = 10) {
    const results = await this.orderItemRepository
      .createQueryBuilder('item')
      .leftJoin('item.menuItem', 'menuItem')
      .select('menuItem.name', 'name')
      .addSelect('SUM(item.quantity)', 'total')
      .groupBy('menuItem.name')
      .orderBy('total', 'DESC')
      .limit(limit)
      .getRawMany();

    return results.map((r: { name: string; total: string }) => ({
      name: r.name,
      total: parseInt(r.total, 10),
    }));
  }

  async getDailyRevenue(days: number = 7) {
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);
    startDate.setHours(0, 0, 0, 0);

    const results = await this.orderRepository
      .createQueryBuilder('order')
      .select("DATE(order.paidAt)", 'date')
      .addSelect('COALESCE(SUM(order.totalAmount), 0)', 'revenue')
      .where('order.paymentStatus = :status', { status: PaymentStatus.PAID })
      .andWhere('order.paidAt >= :startDate', { startDate })
      .groupBy("DATE(order.paidAt)")
      .orderBy('date', 'ASC')
      .getRawMany();

    return results.map((r: { date: string; revenue: string }) => ({
      date: r.date,
      revenue: parseFloat(r.revenue),
    }));
  }
}
