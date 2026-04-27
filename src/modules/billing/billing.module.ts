/**
 * Billing Module.
 *
 * SOLID: Single Responsibility Principle (SRP)
 * - Encapsulates billing and payment concerns.
 */

import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { BillingController } from './billing.controller.js';
import { BillingService } from './billing.service.js';
import { Order } from '../../entities/order.entity.js';
import { BillingRecord } from '../../entities/billing-record.entity.js';
import { ActivityLog } from '../../entities/activity-log.entity.js';
import { ActivityLogService } from '../admin/activity-log.service.js';

@Module({
  imports: [TypeOrmModule.forFeature([Order, BillingRecord, ActivityLog])],
  controllers: [BillingController],
  providers: [BillingService, ActivityLogService],
  exports: [BillingService],
})
export class BillingModule {}
