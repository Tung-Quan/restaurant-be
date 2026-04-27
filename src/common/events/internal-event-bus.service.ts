/**
 * Lightweight in-process event bus for asynchronous module communication.
 *
 * This keeps feature modules decoupled while avoiding network overhead inside
 * the modular monolith.
 */

import { Injectable, Logger } from '@nestjs/common';
import { Observable, Subject } from 'rxjs';

type EventHandler<TPayload> = (payload: TPayload) => void | Promise<void>;

export interface InternalRealtimeEvent<TPayload = unknown> {
  event_name: string;
  payload: TPayload;
  published_at: Date;
}

@Injectable()
export class InternalEventBusService {
  private readonly logger = new Logger(InternalEventBusService.name);
  private readonly handlers = new Map<string, EventHandler<unknown>[]>();
  private readonly eventStream = new Subject<InternalRealtimeEvent>();

  subscribe<TPayload>(
    eventName: string,
    handler: EventHandler<TPayload>,
  ): () => void {
    const currentHandlers = this.handlers.get(eventName) ?? [];
    const typedHandler = handler as EventHandler<unknown>;
    this.handlers.set(eventName, [...currentHandlers, typedHandler]);

    return () => {
      const nextHandlers = (this.handlers.get(eventName) ?? []).filter(
        (registeredHandler) => registeredHandler !== typedHandler,
      );
      this.handlers.set(eventName, nextHandlers);
    };
  }

  publishAsync<TPayload>(eventName: string, payload: TPayload): void {
    const eventHandlers = this.handlers.get(eventName) ?? [];
    this.eventStream.next({
      event_name: eventName,
      payload,
      published_at: new Date(),
    });

    for (const handler of eventHandlers) {
      void Promise.resolve()
        .then(() => handler(payload))
        .catch((error: unknown) => {
          const message =
            error instanceof Error
              ? error.message
              : 'Unknown event handler error';
          this.logger.error(
            `Failed to handle event "${eventName}": ${message}`,
          );
        });
    }
  }

  getEventStream(): Observable<InternalRealtimeEvent> {
    return this.eventStream.asObservable();
  }
}
