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
} from 'typeorm';
import { TableStatus } from '../common/enums/index.js';

@Entity('restaurant_tables')
export class RestaurantTable {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'table_number' })
  tableNumber: number;

  @Column()
  capacity: number;

  @Column({ type: 'text', default: TableStatus.AVAILABLE })
  status: TableStatus;

  @Column({ name: 'location_zone', default: 'main' })
  locationZone: string;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt: Date;
}
