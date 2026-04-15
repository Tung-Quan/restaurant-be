/**
 * Reservations Service.
 *
 * SOLID: Single Responsibility Principle (SRP)
 * - Handles reservation business logic only.
 *
 * SOLID: Dependency Inversion Principle (DIP)
 * - Depends on Repository abstractions.
 */

import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Between, Repository } from 'typeorm';
import { Reservation } from '../../entities/reservation.entity.js';
import {
  CreateReservationDto,
  UpdateReservationStatusDto,
} from './dto/reservation.dto.js';

@Injectable()
export class ReservationsService {
  constructor(
    @InjectRepository(Reservation)
    private readonly reservationRepository: Repository<Reservation>,
  ) {}

  async findAll(sort?: string) {
    const order: Record<string, 'ASC' | 'DESC'> = {};
    if (sort === 'reservation_time') {
      order['reservationTime'] = 'ASC';
    } else {
      order['reservationTime'] = 'ASC';
    }

    const reservations = await this.reservationRepository.find({
      relations: ['table'],
      order,
    });

    return reservations.map((r) => ({
      id: r.id,
      customer_name: r.customerName,
      customer_phone: r.customerPhone,
      party_size: r.partySize,
      reservation_time: r.reservationTime,
      status: r.status,
      notes: r.notes,
      table: r.table
        ? { id: r.table.id, table_number: r.table.tableNumber }
        : null,
    }));
  }

  async create(dto: CreateReservationDto) {
    const reservation = this.reservationRepository.create({
      customerName: dto.customer_name,
      customerPhone: dto.customer_phone || null,
      partySize: dto.party_size,
      reservationTime: new Date(dto.reservation_time),
      notes: dto.notes || null,
    });

    const saved = await this.reservationRepository.save(reservation);

    return {
      id: saved.id,
      status: saved.status,
    };
  }

  async updateStatus(id: string, dto: UpdateReservationStatusDto) {
    const reservation = await this.reservationRepository.findOne({
      where: { id },
    });

    if (!reservation) {
      throw new NotFoundException('Reservation not found');
    }

    reservation.status = dto.status;
    const saved = await this.reservationRepository.save(reservation);

    return {
      id: saved.id,
      status: saved.status,
    };
  }

  async countToday(): Promise<number> {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    return this.reservationRepository.count({
      where: {
        reservationTime: Between(today, tomorrow),
      },
    });
  }
}
