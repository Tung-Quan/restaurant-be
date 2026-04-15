/**
 * Analytics Controller.
 *
 * SOLID: Single Responsibility Principle (SRP)
 * - Handles HTTP layer for analytics endpoints only.
 */

import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { AnalyticsService } from './analytics.service.js';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard.js';
import { RolesGuard } from '../../common/guards/roles.guard.js';
import { Roles } from '../../common/decorators/roles.decorator.js';
import { Role } from '../../common/enums/index.js';

@Controller('analytics')
@UseGuards(JwtAuthGuard, RolesGuard)
export class AnalyticsController {
  constructor(private readonly analyticsService: AnalyticsService) {}

  @Get('orders-by-status')
  @Roles(Role.ADMIN, Role.MANAGER)
  getOrdersByStatus() {
    return this.analyticsService.getOrdersByStatus();
  }

  @Get('top-items')
  @Roles(Role.ADMIN, Role.MANAGER)
  getTopItems(@Query('limit') limit?: string) {
    return this.analyticsService.getTopItems(
      limit ? parseInt(limit, 10) : 10,
    );
  }

  @Get('daily-revenue')
  @Roles(Role.ADMIN, Role.MANAGER)
  getDailyRevenue(@Query('days') days?: string) {
    return this.analyticsService.getDailyRevenue(
      days ? parseInt(days, 10) : 7,
    );
  }
}
