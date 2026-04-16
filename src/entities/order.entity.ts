/**
 * Order Entity.
 *
 * SOLID: Single Responsibility Principle (SRP)
 * - Represents an order and its database mapping.
 */

import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  OneToMany,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { OrderItem } from './order-item.entity.js';
import { RestaurantTable } from './table.entity.js';
import { User } from './user.entity.js';
import {
  OrderStatus,
  PaymentStatus,
  PaymentMethod,
} from '../common/enums/index.js';

@Entity('orders')
export class Order {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'table_id' })
  tableId: string;

  @Column({ name: 'server_id', type: 'uuid', nullable: true })
  serverId: string | null;

  @Column({ name: 'order_type', type: 'text', default: 'dine_in' })
  orderType: string;

  @Column({ type: 'text', default: OrderStatus.PENDING })
  status: OrderStatus;

  @Column({ name: 'special_instructions', type: 'text', nullable: true })
  specialInstructions: string | null;

  @Column({ type: 'decimal', precision: 10, scale: 2, default: 0 })
  subtotal: number;

  @Column({ type: 'decimal', precision: 10, scale: 2, default: 0 })
  tax: number;

  @Column({ type: 'decimal', precision: 10, scale: 2, default: 0 })
  discount: number;

  @Column({ name: 'total_amount', type: 'decimal', precision: 10, scale: 2, default: 0 })
  totalAmount: number;

  @Column({
    name: 'payment_status',
    type: 'text',
    default: PaymentStatus.UNPAID,
  })
  paymentStatus: PaymentStatus;

  @Column({
    name: 'payment_method',
    type: 'text',
    nullable: true,
  })
  paymentMethod: PaymentMethod | null;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamptz' })
  updatedAt: Date;

  @OneToMany(() => OrderItem, (item) => item.order, { cascade: true })
  items: OrderItem[];

  @ManyToOne(() => RestaurantTable)
  @JoinColumn({ name: 'table_id' })
  table: RestaurantTable;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'server_id' })
  server: User;
}
