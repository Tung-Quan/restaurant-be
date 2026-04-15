/**
 * Reservations Module.
 *
 * SOLID: Single Responsibility Principle (SRP)
 * - Encapsulates reservation management concerns.
 */

import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ReservationsController } from './reservations.controller.js';
import { ReservationsService } from './reservations.service.js';
import { Reservation } from '../../entities/reservation.entity.js';

@Module({
  imports: [TypeOrmModule.forFeature([Reservation])],
  controllers: [ReservationsController],
  providers: [ReservationsService],
  exports: [ReservationsService],
})
export class ReservationsModule {}
