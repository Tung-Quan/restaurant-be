import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { PaymentMethod } from '../common/enums/index.js';
import { Order } from './order.entity.js';
import { RestaurantTable } from './table.entity.js';

@Entity('billing_records')
export class BillingRecord {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'order_id', type: 'uuid' })
  orderId: string;

  @Column({ name: 'table_id', type: 'uuid', nullable: true })
  tableId: string | null;

  @Column({ name: 'table_number', type: 'int', nullable: true })
  tableNumber: number | null;

  @Column({ name: 'payment_method', type: 'text' })
  paymentMethod: PaymentMethod;

  @Column({ name: 'amount_paid', type: 'decimal', precision: 10, scale: 2 })
  amountPaid: number;

  @Column({ type: 'decimal', precision: 10, scale: 2 })
  subtotal: number;

  @Column({ type: 'decimal', precision: 10, scale: 2 })
  tax: number;

  @Column({ type: 'decimal', precision: 10, scale: 2 })
  discount: number;

  @Column({ name: 'tip_amount', type: 'decimal', precision: 10, scale: 2 })
  tipAmount: number;

  @Column({ name: 'total_amount', type: 'decimal', precision: 10, scale: 2 })
  totalAmount: number;

  @Column({ name: 'promotion_code', type: 'text', nullable: true })
  promotionCode: string | null;

  @Column({ name: 'paid_at', type: 'timestamptz' })
  paidAt: Date;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt: Date;

  @ManyToOne(() => Order)
  @JoinColumn({ name: 'order_id' })
  order: Order;

  @ManyToOne(() => RestaurantTable)
  @JoinColumn({ name: 'table_id' })
  table: RestaurantTable | null;
}
