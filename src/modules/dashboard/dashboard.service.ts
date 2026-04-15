/**
 * Dashboard Service.
 *
 * SOLID: Single Responsibility Principle (SRP)
 * - Aggregates data from other services for the dashboard summary.
 *
 * SOLID: Dependency Inversion Principle (DIP)
 * - Depends on injected service abstractions, not concrete database calls.
 *   Each dependency is a focused service from another module.
 *
 * SOLID: Open/Closed Principle (OCP)
 * - New dashboard metrics can be added by injecting new services
 *   without modifying existing aggregation logic.
 */

import { Injectable } from '@nestjs/common';
import { OrdersService } from '../orders/orders.service.js';
import { TablesService } from '../tables/tables.service.js';
import { ReservationsService } from '../reservations/reservations.service.js';
import { InventoryService } from '../inventory/inventory.service.js';
import { BillingService } from '../billing/billing.service.js';
import { OrderStatus } from '../../common/enums/index.js';

@Injectable()
export class DashboardService {
  constructor(
    private readonly ordersService: OrdersService,
    private readonly tablesService: TablesService,
    private readonly reservationsService: ReservationsService,
    private readonly inventoryService: InventoryService,
    private readonly billingService: BillingService,
  ) {}

  async getSummary() {
    const [
      totalOrders,
      activeOrders,
      availableTables,
      todayReservations,
      lowStockItems,
      todayRevenue,
    ] = await Promise.all([
      this.ordersService.countTodayOrders(),
      this.ordersService.countByStatus([
        OrderStatus.PENDING,
        OrderStatus.IN_PROGRESS,
        OrderStatus.READY,
        OrderStatus.SERVED,
      ]),
      this.tablesService.countAvailable(),
      this.reservationsService.countToday(),
      this.inventoryService.countLowStock(),
      this.billingService.getTodayRevenue(),
    ]);

    return {
      total_orders: totalOrders,
      active_orders: activeOrders,
      available_tables: availableTables,
      today_reservations: todayReservations,
      low_stock_items: lowStockItems,
      today_revenue: todayRevenue,
    };
  }
}
