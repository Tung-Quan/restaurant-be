import {
  OnGatewayConnection,
  OnGatewayDisconnect,
  WebSocketGateway,
  WebSocketServer,
} from '@nestjs/websockets';
import { JwtService } from '@nestjs/jwt';
import { Subscription } from 'rxjs';
import { Server, Socket } from 'socket.io';
import {
  InternalEventBusService,
  InternalRealtimeEvent,
} from './internal-event-bus.service.js';

@WebSocketGateway({
  namespace: 'events',
  cors: {
    origin: true,
    credentials: true,
  },
})
export class RealtimeEventsGateway
  implements OnGatewayConnection, OnGatewayDisconnect
{
  @WebSocketServer()
  private server: Server;

  private subscription?: Subscription;
  private readonly connectedClientIds = new Set<string>();

  constructor(
    private readonly eventBus: InternalEventBusService,
    private readonly jwtService: JwtService,
  ) {}

  afterInit(): void {
    this.subscription = this.eventBus
      .getEventStream()
      .subscribe((event) => this.broadcast(event));
  }

  handleConnection(client: Socket): void {
    const token = this.extractAccessToken(client);
    if (!token) {
      client.disconnect(true);
      return;
    }

    try {
      this.jwtService.verify(token);
      this.connectedClientIds.add(client.id);
      client.emit('connected', { transport: 'websocket' });
    } catch {
      client.disconnect(true);
    }
  }

  handleDisconnect(client: Socket): void {
    this.connectedClientIds.delete(client.id);
  }

  onModuleDestroy(): void {
    this.subscription?.unsubscribe();
  }

  private broadcast(event: InternalRealtimeEvent): void {
    if (!this.server || this.connectedClientIds.size === 0) {
      return;
    }

    this.server.emit(event.event_name, event);
    this.server.emit('message', event);
  }

  private extractAccessToken(client: Socket): string | null {
    const authToken = client.handshake.auth?.token;
    if (typeof authToken === 'string' && authToken.length > 0) {
      return authToken;
    }

    const queryToken = client.handshake.query.access_token;
    if (typeof queryToken === 'string' && queryToken.length > 0) {
      return queryToken;
    }

    return null;
  }
}
