/**
 * Admin Service.
 *
 * SOLID: Single Responsibility Principle (SRP)
 * - Handles admin-specific business logic: staff management, role assignment.
 *
 * SOLID: Dependency Inversion Principle (DIP)
 * - Depends on Repository abstractions and other service abstractions.
 *
 * SOLID: Open/Closed Principle (OCP)
 * - New admin operations can be added without modifying existing methods.
 */

import {
  Injectable,
  NotFoundException,
  ConflictException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from '../../entities/user.entity.js';
import { UserRole } from '../../entities/user-role.entity.js';
import { Role } from '../../common/enums/index.js';

@Injectable()
export class AdminService {
  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    @InjectRepository(UserRole)
    private readonly userRoleRepository: Repository<UserRole>,
  ) {}

  async getStaff() {
    const users = await this.userRepository.find({
      relations: ['userRoles'],
      order: { createdAt: 'DESC' },
    });

    return users.map((user) => ({
      user_id: user.id,
      display_name: user.displayName,
      phone: user.phone,
      avatar_url: user.avatarUrl,
      created_at: user.createdAt,
      roles: user.userRoles.map((ur) => ur.role),
    }));
  }

  async assignRole(userId: string, role: Role) {
    const user = await this.userRepository.findOne({
      where: { id: userId },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    const existing = await this.userRoleRepository.findOne({
      where: { userId, role },
    });

    if (existing) {
      throw new ConflictException('User already has this role');
    }

    const userRole = this.userRoleRepository.create({ userId, role });
    await this.userRoleRepository.save(userRole);

    return {
      user_id: userId,
      role,
    };
  }

  async removeRole(userId: string, role: Role) {
    const userRole = await this.userRoleRepository.findOne({
      where: { userId, role },
    });

    if (!userRole) {
      throw new NotFoundException('Role assignment not found');
    }

    await this.userRoleRepository.remove(userRole);

    return { removed: true };
  }
}
