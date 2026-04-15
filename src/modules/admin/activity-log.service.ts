/**
 * Activity Log Service.
 *
 * SOLID: Single Responsibility Principle (SRP)
 * - Handles activity log creation and retrieval only.
 *
 * SOLID: Open/Closed Principle (OCP)
 * - New action types can be logged without modifying this service.
 *   The service accepts any string as the action type.
 *
 * SOLID: Dependency Inversion Principle (DIP)
 * - Depends on Repository abstraction.
 */

import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ActivityLog } from '../../entities/activity-log.entity.js';

@Injectable()
export class ActivityLogService {
  constructor(
    @InjectRepository(ActivityLog)
    private readonly activityLogRepository: Repository<ActivityLog>,
  ) {}

  async log(
    userId: string,
    action: string,
    entityType: string,
    entityId?: string,
    details?: Record<string, any>,
  ): Promise<ActivityLog> {
    const log = this.activityLogRepository.create({
      userId,
      action,
      entityType,
      entityId: entityId || null,
      details: details || null,
    });
    return this.activityLogRepository.save(log);
  }

  async findAll(limit: number = 50) {
    const logs = await this.activityLogRepository.find({
      order: { createdAt: 'DESC' },
      take: limit,
    });

    return logs.map((log) => ({
      id: log.id,
      user_id: log.userId,
      action: log.action,
      entity_type: log.entityType,
      entity_id: log.entityId,
      details: log.details,
      created_at: log.createdAt,
    }));
  }
}
