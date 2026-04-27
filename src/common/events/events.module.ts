import { Global, Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { JwtModule } from '@nestjs/jwt';
import { TypeOrmModule } from '@nestjs/typeorm';
import { OutboxEvent } from '../../entities/outbox-event.entity.js';
import { InternalEventBusService } from './internal-event-bus.service.js';
import { OutboxEventService } from './outbox-event.service.js';
import { RealtimeEventsController } from './realtime-events.controller.js';
import { RealtimeEventsGateway } from './realtime-events.gateway.js';

@Global()
@Module({
  imports: [
    TypeOrmModule.forFeature([OutboxEvent]),
    JwtModule.registerAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        secret: configService.get<string>('JWT_SECRET', 'default-secret'),
      }),
    }),
  ],
  controllers: [RealtimeEventsController],
  providers: [InternalEventBusService, OutboxEventService, RealtimeEventsGateway],
  exports: [InternalEventBusService, OutboxEventService],
})
export class EventsModule {}
