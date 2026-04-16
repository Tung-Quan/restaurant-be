/**
 * MenuItem Entity.
 *
 * SOLID: Single Responsibility Principle (SRP)
 * - Represents a menu item and its database mapping.
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
import { MenuCategory } from './menu-category.entity.js';

@Entity('menu_items')
export class MenuItem {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  name: string;

  @Column({ type: 'text', nullable: true })
  description: string | null;

  @Column({ type: 'decimal', precision: 10, scale: 2 })
  price: number;

  @Column({ name: 'category_id' })
  categoryId: string;

  @Column({ name: 'image_url', type: 'varchar', nullable: true })
  imageUrl: string | null;

  @Column({ name: 'is_available', default: true })
  isAvailable: boolean;

  @Column({ name: 'prep_time_minutes', default: 15 })
  prepTimeMinutes: number;

  @Column({ type: 'text', array: true, nullable: true })
  allergens: string[] | null;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamptz' })
  updatedAt: Date;

  @ManyToOne(() => MenuCategory, (cat) => cat.items)
  @JoinColumn({ name: 'category_id' })
  category: MenuCategory;
}
