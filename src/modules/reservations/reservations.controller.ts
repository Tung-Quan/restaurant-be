/**
 * Reservations Controller.
 *
 * SOLID: Single Responsibility Principle (SRP)
 * - Handles HTTP layer for reservation endpoints only.
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
import { ReservationsService } from './reservations.service.js';
import {
  CreateReservationDto,
  UpdateReservationStatusDto,
} from './dto/reservation.dto.js';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard.js';
import { RolesGuard } from '../../common/guards/roles.guard.js';
import { Roles } from '../../common/decorators/roles.decorator.js';
import { Role } from '../../common/enums/index.js';

@Controller('reservations')
@UseGuards(JwtAuthGuard, RolesGuard)
export class ReservationsController {
  constructor(private readonly reservationsService: ReservationsService) {}

  @Get()
  @Roles(Role.ADMIN, Role.MANAGER, Role.SERVER, Role.HOST)
  findAll(@Query('sort') sort?: string) {
    return this.reservationsService.findAll(sort);
  }

  @Post()
  @Roles(Role.ADMIN, Role.MANAGER, Role.SERVER, Role.HOST)
  create(@Body() dto: CreateReservationDto) {
    return this.reservationsService.create(dto);
  }

  @Patch(':id/status')
  @Roles(Role.ADMIN, Role.MANAGER, Role.SERVER, Role.HOST)
  updateStatus(
    @Param('id') id: string,
    @Body() dto: UpdateReservationStatusDto,
  ) {
    return this.reservationsService.updateStatus(id, dto);
  }
}
