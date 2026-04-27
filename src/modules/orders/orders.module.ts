/**
 * Orders Module.
 *
 * SOLID: Single Responsibility Principle (SRP)
 * - Encapsulates order management concerns.
 */

import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { OrdersController } from './orders.controller.js';
import { OrdersService } from './orders.service.js';
import { Order } from '../../entities/order.entity.js';
import { OrderItem } from '../../entities/order-item.entity.js';
import { MenuItem } from '../../entities/menu-item.entity.js';
import { ActivityLog } from '../../entities/activity-log.entity.js';
import { ActivityLogService } from '../admin/activity-log.service.js';

@Module({
  imports: [TypeOrmModule.forFeature([Order, OrderItem, MenuItem, ActivityLog])],
  controllers: [OrdersController],
  providers: [OrdersService, ActivityLogService],
  exports: [OrdersService],
})
export class OrdersModule {}
