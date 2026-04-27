/**
 * Orders Controller.
 *
 * SOLID: Single Responsibility Principle (SRP)
 * - Handles HTTP layer for order endpoints only.
 *
 * SOLID: Dependency Inversion Principle (DIP)
 * - Depends on OrdersService abstraction.
 */

import {
  Controller,
  Get,
  Post,
  Patch,
  Param,
  Body,
  Query,
  UseGuards,
} from '@nestjs/common';
import { OrdersService } from './orders.service.js';
import { CreateOrderDto, UpdateOrderStatusDto } from './dto/order.dto.js';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard.js';
import { RolesGuard } from '../../common/guards/roles.guard.js';
import { Roles } from '../../common/decorators/roles.decorator.js';
import { CurrentUser } from '../../common/decorators/current-user.decorator.js';
import { Role } from '../../common/enums/index.js';

@Controller('orders')
@UseGuards(JwtAuthGuard, RolesGuard)
export class OrdersController {
  constructor(private readonly ordersService: OrdersService) {}

  @Get()
  @Roles(Role.ADMIN, Role.MANAGER, Role.SERVER)
  findAll(
    @Query('include') include?: string,
    @Query('limit') limit?: string,
    @Query('sort') sort?: string,
    @Query('status') status?: string,
  ) {
    return this.ordersService.findAll({
      include,
      limit: limit ? parseInt(limit, 10) : undefined,
      sort,
      status,
    });
  }

  @Post()
  @Roles(Role.ADMIN, Role.MANAGER, Role.SERVER)
  create(@Body() dto: CreateOrderDto, @CurrentUser('id') userId: string) {
    return this.ordersService.create(dto, userId);
  }

  @Patch(':id/status')
  @Roles(Role.ADMIN, Role.MANAGER, Role.SERVER, Role.CASHIER)
  updateStatus(@Param('id') id: string, @Body() dto: UpdateOrderStatusDto) {
    return this.ordersService.updateStatus(id, dto.status);
  }

  @Patch(':id/cancel')
  @Roles(Role.ADMIN, Role.MANAGER, Role.SERVER)
  cancel(@Param('id') id: string, @CurrentUser('id') userId: string) {
    return this.ordersService.cancel(id, userId);
  }
}
