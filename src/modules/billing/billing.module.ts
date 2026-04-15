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

@Module({
  imports: [TypeOrmModule.forFeature([Order])],
  controllers: [BillingController],
  providers: [BillingService],
  exports: [BillingService],
})
export class BillingModule {}
