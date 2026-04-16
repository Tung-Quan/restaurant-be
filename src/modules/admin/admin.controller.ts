/**
 * Admin Controller.
 *
 * SOLID: Single Responsibility Principle (SRP)
 * - Handles HTTP layer for admin endpoints only.
 *
 * SOLID: Interface Segregation Principle (ISP)
 * - This controller groups admin-only operations, separated from
 *   the regular menu/table controllers used by other roles.
 *
 * SOLID: Dependency Inversion Principle (DIP)
 * - Depends on service abstractions (AdminService, MenuService,
 *   TablesService, ActivityLogService).
 */

import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Param,
  Body,
  Query,
  UseGuards,
} from '@nestjs/common';
import { AdminService } from './admin.service.js';
import { ActivityLogService } from './activity-log.service.js';
import { MenuService } from '../menu/menu.service.js';
import { TablesService } from '../tables/tables.service.js';
import {
  CreateMenuItemDto,
  CreateMenuCategoryDto,
  UpdateMenuItemAvailabilityDto,
} from '../menu/dto/menu.dto.js';
import { CreateTableDto } from '../tables/dto/table.dto.js';
import { AssignRoleDto } from './dto/admin.dto.js';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard.js';
import { RolesGuard } from '../../common/guards/roles.guard.js';
import { Roles } from '../../common/decorators/roles.decorator.js';
import { CurrentUser } from '../../common/decorators/current-user.decorator.js';
import { Role } from '../../common/enums/index.js';

@Controller('admin')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(Role.ADMIN)
export class AdminController {
  constructor(
    private readonly adminService: AdminService,
    private readonly activityLogService: ActivityLogService,
    private readonly menuService: MenuService,
    private readonly tablesService: TablesService,
  ) {}

  // --- Menu Categories ---
  @Get('menu-categories')
  getMenuCategories() {
    return this.menuService.findAllCategories();
  }

  @Post('menu-categories')
  async createMenuCategory(
    @Body() dto: CreateMenuCategoryDto,
    @CurrentUser('id') userId: string,
  ) {
    const category = await this.menuService.createCategory(dto);
    await this.activityLogService.log(
      userId,
      'CREATE_MENU_CATEGORY',
      'menu_categories',
      category.id,
    );
    return category;
  }

  // --- Menu Items ---
  @Get('menu-items')
  getMenuItems(@Query('include') include?: string) {
    const includeCategory = include?.includes('category') ?? false;
    return this.menuService.findAllItems(undefined, includeCategory);
  }

  @Post('menu-items')
  async createMenuItem(
    @Body() dto: CreateMenuItemDto,
    @CurrentUser('id') userId: string,
  ) {
    const item = await this.menuService.createItem(dto);
    await this.activityLogService.log(
      userId,
      'CREATE_MENU_ITEM',
      'menu_items',
      item.id,
    );
    return item;
  }

  @Patch('menu-items/:id/availability')
  async updateMenuItemAvailability(
    @Param('id') id: string,
    @Body() dto: UpdateMenuItemAvailabilityDto,
    @CurrentUser('id') userId: string,
  ) {
    const result = await this.menuService.updateAvailability(id, dto);
    await this.activityLogService.log(
      userId,
      'UPDATE_MENU_ITEM_AVAILABILITY',
      'menu_items',
      id,
      { is_available: dto.is_available },
    );
    return result;
  }

  // --- Tables ---
  @Get('tables')
  getTables() {
    return this.tablesService.findAll();
  }

  @Post('tables')
  async createTable(
    @Body() dto: CreateTableDto,
    @CurrentUser('id') userId: string,
  ) {
    const table = await this.tablesService.create(dto);
    await this.activityLogService.log(
      userId,
      'CREATE_TABLE',
      'restaurant_tables',
      table.id,
    );
    return table;
  }

  // --- Staff ---
  @Get('staff')
  getStaff() {
    return this.adminService.getStaff();
  }

  @Post('staff/:userId/roles')
  async assignRole(
    @Param('userId') userId: string,
    @Body() dto: AssignRoleDto,
    @CurrentUser('id') adminId: string,
  ) {
    const result = await this.adminService.assignRole(userId, dto.role);
    await this.activityLogService.log(
      adminId,
      'ASSIGN_ROLE',
      'user_roles',
      userId,
      { role: dto.role },
    );
    return result;
  }

  @Delete('staff/:userId/roles/:role')
  async removeRole(
    @Param('userId') userId: string,
    @Param('role') role: Role,
    @CurrentUser('id') adminId: string,
  ) {
    const result = await this.adminService.removeRole(userId, role);
    await this.activityLogService.log(
      adminId,
      'REMOVE_ROLE',
      'user_roles',
      userId,
      { role },
    );
    return result;
  }

  // --- Activity Logs ---
  @Get('activity-logs')
  getActivityLogs(@Query('limit') limit?: string) {
    return this.activityLogService.findAll(limit ? parseInt(limit, 10) : 50);
  }
}
