/**
 * Inventory Controller.
 *
 * SOLID: Single Responsibility Principle (SRP)
 * - Handles HTTP layer for inventory endpoints only.
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
import { InventoryService } from './inventory.service.js';
import {
  CreateInventoryItemDto,
  UpdateInventoryQuantityDto,
} from './dto/inventory.dto.js';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard.js';
import { RolesGuard } from '../../common/guards/roles.guard.js';
import { Roles } from '../../common/decorators/roles.decorator.js';
import { Role } from '../../common/enums/index.js';

@Controller('inventory')
@UseGuards(JwtAuthGuard, RolesGuard)
export class InventoryController {
  constructor(private readonly inventoryService: InventoryService) {}

  @Get('items')
  @Roles(Role.ADMIN, Role.MANAGER)
  findAll(@Query('sort') sort?: string) {
    return this.inventoryService.findAll(sort);
  }

  @Get('low-stock')
  @Roles(Role.ADMIN, Role.MANAGER)
  findLowStock() {
    return this.inventoryService.findLowStock();
  }

  @Post('items')
  @Roles(Role.ADMIN, Role.MANAGER)
  create(@Body() dto: CreateInventoryItemDto) {
    return this.inventoryService.create(dto);
  }

  @Patch('items/:id/quantity')
  @Roles(Role.ADMIN, Role.MANAGER)
  updateQuantity(
    @Param('id') id: string,
    @Body() dto: UpdateInventoryQuantityDto,
  ) {
    return this.inventoryService.updateQuantity(id, dto);
  }
}
