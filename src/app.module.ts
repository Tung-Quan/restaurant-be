/**
 * Root Application Module.
 *
 * SOLID: Single Responsibility Principle (SRP)
 * - This module's only job is composing all feature modules together.
 *
 * SOLID: Open/Closed Principle (OCP)
 * - New feature modules can be added to the imports array without
 *   modifying existing modules.
 *
 * SOLID: Dependency Inversion Principle (DIP)
 * - Uses ConfigModule and TypeOrmModule.forRootAsync to depend on
 *   configuration abstractions rather than hardcoded values.
 */

import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { getDatabaseConfig } from './config/database.config.js';
import { AppController } from './app.controller.js';
import { AppService } from './app.service.js';
import { DatabaseBootstrapService } from './database-bootstrap.service.js';

// Feature modules
import { AuthModule } from './modules/auth/auth.module.js';
import { TablesModule } from './modules/tables/tables.module.js';
import { MenuModule } from './modules/menu/menu.module.js';
import { OrdersModule } from './modules/orders/orders.module.js';
import { KitchenModule } from './modules/kitchen/kitchen.module.js';
import { ReservationsModule } from './modules/reservations/reservations.module.js';
import { BillingModule } from './modules/billing/billing.module.js';
import { InventoryModule } from './modules/inventory/inventory.module.js';
import { DashboardModule } from './modules/dashboard/dashboard.module.js';
import { AnalyticsModule } from './modules/analytics/analytics.module.js';
import { AdminModule } from './modules/admin/admin.module.js';

@Module({
  controllers: [AppController],
  imports: [
    // Global configuration
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
    }),

    // Database connection
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: getDatabaseConfig,
    }),

    // Feature modules
    AuthModule,
    TablesModule,
    MenuModule,
    OrdersModule,
    KitchenModule,
    ReservationsModule,
    BillingModule,
    InventoryModule,
    DashboardModule,
    AnalyticsModule,
    AdminModule,
  ],
  providers: [AppService, DatabaseBootstrapService],
})
export class AppModule {}
