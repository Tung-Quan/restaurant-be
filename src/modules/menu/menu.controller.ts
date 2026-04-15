/**
 * Menu Controller.
 *
 * SOLID: Single Responsibility Principle (SRP)
 * - Handles HTTP layer for menu item endpoints only.
 *
 * SOLID: Interface Segregation Principle (ISP)
 * - This controller only exposes the menu-items endpoints.
 *   Admin menu management is in AdminController (separate interface for different clients).
 */

import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { MenuService } from './menu.service.js';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard.js';

@Controller('menu-items')
@UseGuards(JwtAuthGuard)
export class MenuController {
  constructor(private readonly menuService: MenuService) {}

  @Get()
  findAll(
    @Query('is_available') isAvailable?: string,
    @Query('include') include?: string,
  ) {
    const available =
      isAvailable !== undefined ? isAvailable === 'true' : undefined;
    const includeCategory = include?.includes('category') ?? false;
    return this.menuService.findAllItems(available, includeCategory);
  }
}
