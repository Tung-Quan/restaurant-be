/**
 * Billing Controller.
 *
 * SOLID: Single Responsibility Principle (SRP)
 * - Handles HTTP layer for billing endpoints only.
 *
 * SOLID: Interface Segregation Principle (ISP)
 * - Only exposes billing-related endpoints for cashier role.
 */

import {
  Controller,
  Get,
  Post,
  Param,
  Body,
  Query,
  UseGuards,
} from '@nestjs/common';
import { BillingService } from './billing.service.js';
import { CreatePaymentDto, SplitBillDto } from './dto/billing.dto.js';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard.js';
import { RolesGuard } from '../../common/guards/roles.guard.js';
import { Roles } from '../../common/decorators/roles.decorator.js';
import { CurrentUser } from '../../common/decorators/current-user.decorator.js';
import { Role } from '../../common/enums/index.js';

@Controller('billing')
@UseGuards(JwtAuthGuard, RolesGuard)
export class BillingController {
  constructor(private readonly billingService: BillingService) {}

  @Get('orders')
  @Roles(Role.ADMIN, Role.MANAGER, Role.CASHIER)
  getBillableOrders(@Query('status') status?: string) {
    return this.billingService.getBillableOrders(status);
  }

  @Post('orders/:id/payments')
  @Roles(Role.ADMIN, Role.MANAGER, Role.CASHIER)
  processPayment(
    @Param('id') orderId: string,
    @Body() dto: CreatePaymentDto,
    @CurrentUser('id') userId: string,
  ) {
    return this.billingService.processPayment(orderId, dto, userId);
  }

  @Post('orders/:id/split-bill')
  @Roles(Role.ADMIN, Role.MANAGER, Role.CASHIER)
  splitBill(@Param('id') orderId: string, @Body() dto: SplitBillDto) {
    return this.billingService.splitBill(orderId, dto);
  }
}
