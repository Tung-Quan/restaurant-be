/**
 * Reservation Entity.
 *
 * SOLID: Single Responsibility Principle (SRP)
 * - Represents a reservation and its database mapping.
 */

import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { RestaurantTable } from './table.entity.js';
import { ReservationStatus } from '../common/enums/index.js';

@Entity('reservations')
export class Reservation {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'customer_name' })
  customerName: string;

  @Column({ name: 'customer_phone', nullable: true })
  customerPhone: string | null;

  @Column({ name: 'party_size' })
  partySize: number;

  @Column({ name: 'reservation_time' })
  reservationTime: Date;

  @Column({
    type: 'enum',
    enum: ReservationStatus,
    default: ReservationStatus.PENDING,
  })
  status: ReservationStatus;

  @Column({ nullable: true })
  notes: string | null;

  @Column({ name: 'table_id', nullable: true })
  tableId: string | null;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;

  @ManyToOne(() => RestaurantTable, { nullable: true })
  @JoinColumn({ name: 'table_id' })
  table: RestaurantTable | null;
}
