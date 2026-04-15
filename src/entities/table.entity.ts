/**
 * Table Entity.
 *
 * SOLID: Single Responsibility Principle (SRP)
 * - Represents a restaurant table and its database mapping.
 */

import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';
import { TableStatus } from '../common/enums/index.js';

@Entity('tables')
export class RestaurantTable {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'table_number', unique: true })
  tableNumber: number;

  @Column()
  capacity: number;

  @Column({ type: 'enum', enum: TableStatus, default: TableStatus.AVAILABLE })
  status: TableStatus;

  @Column({ name: 'location_zone', default: 'main' })
  locationZone: string;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}
