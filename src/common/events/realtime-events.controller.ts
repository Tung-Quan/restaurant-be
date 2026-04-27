import {
  Controller,
  MessageEvent,
  Query,
  Sse,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { Observable, map } from 'rxjs';
import { InternalEventBusService } from './internal-event-bus.service.js';

@Controller('events')
export class RealtimeEventsController {
  constructor(
    private readonly eventBus: InternalEventBusService,
    private readonly jwtService: JwtService,
  ) {}

  @Sse('stream')
  stream(@Query('access_token') accessToken?: string): Observable<MessageEvent> {
    if (!accessToken) {
      throw new UnauthorizedException('Missing access token');
    }

    try {
      this.jwtService.verify(accessToken);
    } catch {
      throw new UnauthorizedException('Invalid access token');
    }

    return this.eventBus.getEventStream().pipe(
      map((event) => ({
        type: event.event_name,
        data: event,
      })),
    );
  }
}

