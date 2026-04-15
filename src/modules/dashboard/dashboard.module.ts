/**
 * Dashboard Module.
 *
 * SOLID: Single Responsibility Principle (SRP)
 * - Encapsulates dashboard aggregation concerns.
 *
 * SOLID: Dependency Inversion Principle (DIP)
 * - Imports other modules and depends on their exported service abstractions.
 */

import { Module } from '@nestjs/common';
import { DashboardController } from './dashboard.controller.js';
import { DashboardService } from './dashboard.service.js';
import { OrdersModule } from '../orders/orders.module.js';
import { TablesModule } from '../tables/tables.module.js';
import { ReservationsModule } from '../reservations/reservations.module.js';
import { InventoryModule } from '../inventory/inventory.module.js';
import { BillingModule } from '../billing/billing.module.js';

@Module({
  imports: [
    OrdersModule,
    TablesModule,
    ReservationsModule,
    InventoryModule,
    BillingModule,
  ],
  controllers: [DashboardController],
  providers: [DashboardService],
})
export class DashboardModule {}
