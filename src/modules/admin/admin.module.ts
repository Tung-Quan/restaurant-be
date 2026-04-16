/**
 * Admin Module.
 *
 * SOLID: Single Responsibility Principle (SRP)
 * - Encapsulates admin-specific concerns: staff, roles, activity logs, and
 *   admin-level CRUD for menu/tables.
 *
 * SOLID: Dependency Inversion Principle (DIP)
 * - Imports MenuModule and TablesModule to reuse their exported services.
 */

import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AdminController } from './admin.controller.js';
import { AdminService } from './admin.service.js';
import { ActivityLogService } from './activity-log.service.js';
import { User } from '../../entities/user.entity.js';
import { Profile } from '../../entities/profile.entity.js';
import { UserRole } from '../../entities/user-role.entity.js';
import { ActivityLog } from '../../entities/activity-log.entity.js';
import { MenuModule } from '../menu/menu.module.js';
import { TablesModule } from '../tables/tables.module.js';

@Module({
  imports: [
    TypeOrmModule.forFeature([User, Profile, UserRole, ActivityLog]),
    MenuModule,
    TablesModule,
  ],
  controllers: [AdminController],
  providers: [AdminService, ActivityLogService],
  exports: [ActivityLogService],
})
export class AdminModule {}
