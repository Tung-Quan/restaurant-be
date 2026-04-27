import {
  Injectable,
  Logger,
  OnModuleDestroy,
  OnModuleInit,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { EntityManager, Repository } from 'typeorm';
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
    private readonly eventBus: InternalEventBusService,
  ) {}

  onModuleInit(): void {
    this.dispatchTimer = setInterval(() => {
      void this.dispatchPending();
    }, DISPATCH_INTERVAL_MS);
    this.dispatchTimer.unref?.();
    void this.dispatchPending();
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
