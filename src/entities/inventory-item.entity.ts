/**
 * InventoryItem Entity.
 *
 * SOLID: Single Responsibility Principle (SRP)
 * - Represents an inventory item and its database mapping.
 */

import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';

@Entity('inventory_items')
export class InventoryItem {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  name: string;

  @Column()
  unit: string;

  @Column({ type: 'decimal', precision: 10, scale: 2 })
  quantity: number;

  @Column({ name: 'min_threshold', type: 'decimal', precision: 10, scale: 2, default: 0 })
  minThreshold: number;

  @Column({ nullable: true })
  supplier: string | null;

  @Column({ name: 'cost_per_unit', type: 'decimal', precision: 10, scale: 2, default: 0 })
  costPerUnit: number;

  @Column({ name: 'last_restocked_at', nullable: true })
  lastRestockedAt: Date | null;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}
