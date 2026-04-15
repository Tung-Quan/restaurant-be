/**
 * Tables Controller.
 *
 * SOLID: Single Responsibility Principle (SRP)
 * - Handles HTTP layer for table endpoints only.
 *
 * SOLID: Dependency Inversion Principle (DIP)
 * - Depends on TablesService abstraction.
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
import { TablesService } from './tables.service.js';
import { UpdateTableStatusDto } from './dto/table.dto.js';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard.js';
import { RolesGuard } from '../../common/guards/roles.guard.js';
import { Roles } from '../../common/decorators/roles.decorator.js';
import { Role } from '../../common/enums/index.js';

@Controller('tables')
@UseGuards(JwtAuthGuard, RolesGuard)
export class TablesController {
  constructor(private readonly tablesService: TablesService) {}

  @Get()
  @Roles(Role.ADMIN, Role.MANAGER, Role.SERVER, Role.HOST)
  findAll(@Query('sort') sort?: string) {
    return this.tablesService.findAll(sort);
  }

  @Patch(':id/status')
  @Roles(Role.ADMIN, Role.MANAGER, Role.SERVER, Role.HOST)
  updateStatus(
    @Param('id') id: string,
    @Body() dto: UpdateTableStatusDto,
  ) {
    return this.tablesService.updateStatus(id, dto);
  }
}
