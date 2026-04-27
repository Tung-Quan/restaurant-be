/**
 * Kitchen Controller.
 *
 * SOLID: Single Responsibility Principle (SRP)
 * - Handles HTTP layer for kitchen endpoints only.
 *
 * SOLID: Interface Segregation Principle (ISP)
 * - Exposes only what kitchen staff needs: viewing pending orders and updating item status.
 */

import {
  Controller,
  Get,
  Patch,
  Param,
  Body,
  Query,
  UseGuards,
} from '@nestjs/common';
import { KitchenService } from './kitchen.service.js';
import { UpdateOrderItemStatusDto } from './dto/kitchen.dto.js';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard.js';
import { RolesGuard } from '../../common/guards/roles.guard.js';
import { Roles } from '../../common/decorators/roles.decorator.js';
import { Role } from '../../common/enums/index.js';

@Controller()
@UseGuards(JwtAuthGuard, RolesGuard)
export class KitchenController {
  constructor(private readonly kitchenService: KitchenService) {}

  @Get('kitchen/orders')
  @Roles(Role.ADMIN, Role.MANAGER, Role.CHEF)
  getKitchenOrders(@Query('status') status?: string) {
    return this.kitchenService.getKitchenOrders(status);
  }

  @Get('kitchen/notifications')
  @Roles(Role.ADMIN, Role.MANAGER, Role.CHEF)
  getRecentNotifications() {
    return this.kitchenService.getRecentNotifications();
  }

  @Patch('order-items/:id/status')
  @Roles(Role.ADMIN, Role.MANAGER, Role.CHEF)
  updateOrderItemStatus(
    @Param('id') id: string,
    @Body() dto: UpdateOrderItemStatusDto,
  ) {
    return this.kitchenService.updateOrderItemStatus(id, dto.status);
  }
}
