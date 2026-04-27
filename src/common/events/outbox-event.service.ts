import {
  Injectable,
  Logger,
  OnModuleDestroy,
  OnModuleInit,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, EntityManager, Repository } from 'typeorm';
import {
  OutboxEvent,
  OutboxEventStatus,
} from '../../entities/outbox-event.entity.js';
import { InternalEventBusService } from './internal-event-bus.service.js';

const DISPATCH_INTERVAL_MS = 5000;
const MAX_ATTEMPTS = 10;

@Injectable()
export class OutboxEventService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(OutboxEventService.name);
  private dispatchTimer: NodeJS.Timeout | null = null;

  constructor(
    @InjectRepository(OutboxEvent)
    private readonly outboxRepository: Repository<OutboxEvent>,
    private readonly dataSource: DataSource,
    private readonly eventBus: InternalEventBusService,
  ) {}

  async onModuleInit(): Promise<void> {
    await this.ensureOutboxTable();

    this.dispatchTimer = setInterval(() => {
      void this.dispatchPendingSafely();
    }, DISPATCH_INTERVAL_MS);
    this.dispatchTimer.unref?.();
    void this.dispatchPendingSafely();
  }

  onModuleDestroy(): void {
    if (this.dispatchTimer) {
      clearInterval(this.dispatchTimer);
    }
  }

  async createPending(
    manager: EntityManager,
    eventName: string,
    payload: Record<string, unknown>,
  ): Promise<OutboxEvent> {
    const event = manager.create(OutboxEvent, {
      eventName,
      payload,
      status: OutboxEventStatus.PENDING,
      attempts: 0,
      lastError: null,
      publishedAt: null,
    });
    return manager.save(OutboxEvent, event);
  }

  async recordAndPublish(
    eventName: string,
    payload: Record<string, unknown>,
  ): Promise<OutboxEvent> {
    const event = await this.outboxRepository.save(
      this.outboxRepository.create({
        eventName,
        payload,
        status: OutboxEventStatus.PENDING,
        attempts: 0,
        lastError: null,
        publishedAt: null,
      }),
    );

    await this.publishById(event.id);
    return event;
  }

  async publishById(id: string): Promise<void> {
    const event = await this.outboxRepository.findOne({ where: { id } });
    if (!event || event.status === OutboxEventStatus.PUBLISHED) {
      return;
    }

    await this.publishEvent(event);
  }

  async dispatchPending(limit: number = 50): Promise<void> {
    const events = await this.outboxRepository.find({
      where: { status: OutboxEventStatus.PENDING },
      order: { createdAt: 'ASC' },
      take: limit,
    });

    for (const event of events) {
      await this.publishEvent(event);
    }
  }

  private async dispatchPendingSafely(): Promise<void> {
    try {
      await this.dispatchPending();
    } catch (error) {
      const message =
        error instanceof Error ? error.message : 'Unknown outbox dispatch error';
      this.logger.error(`Failed to dispatch pending outbox events: ${message}`);
    }
  }

  private async ensureOutboxTable(): Promise<void> {
    await this.dataSource.query('CREATE EXTENSION IF NOT EXISTS "pgcrypto"');

    await this.dataSource.query(`
      CREATE TABLE IF NOT EXISTS public.outbox_events (
        id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
        event_name TEXT NOT NULL,
        payload JSONB NOT NULL,
        status TEXT NOT NULL DEFAULT '${OutboxEventStatus.PENDING}',
        attempts INTEGER NOT NULL DEFAULT 0,
        last_error TEXT NULL,
        published_at TIMESTAMPTZ NULL,
        created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
        updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
      )
    `);

    await this.dataSource.query(`
      CREATE INDEX IF NOT EXISTS idx_outbox_events_status_created_at
      ON public.outbox_events (status, created_at)
    `);
  }

  private async publishEvent(event: OutboxEvent): Promise<void> {
    try {
      this.eventBus.publishAsync(event.eventName, event.payload);
      event.status = OutboxEventStatus.PUBLISHED;
      event.publishedAt = new Date();
      event.lastError = null;
    } catch (error) {
      event.lastError =
        error instanceof Error ? error.message : 'Unknown outbox publish error';
      event.status =
        event.attempts + 1 >= MAX_ATTEMPTS
          ? OutboxEventStatus.FAILED
          : OutboxEventStatus.PENDING;
      this.logger.error(
        `Failed to publish outbox event ${event.id}: ${event.lastError}`,
      );
    } finally {
      event.attempts += 1;
      await this.outboxRepository.save(event);
    }
  }
}
