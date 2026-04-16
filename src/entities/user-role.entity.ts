/**
 * UserRole Entity (join table for User <-> Role).
 *
 * SOLID: Single Responsibility Principle (SRP)
 * - Maps the many-to-many relationship between users and roles.
 */

import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { User } from './user.entity.js';
import { Role } from '../common/enums/index.js';

@Entity('user_roles')
export class UserRole {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'user_id' })
  userId: string;

  @Column({ type: 'enum', enum: Role, enumName: 'app_role' })
  role: Role;

  @ManyToOne(() => User, (user) => user.userRoles, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'user_id' })
  user: User;
}
