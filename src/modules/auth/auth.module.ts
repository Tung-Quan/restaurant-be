/**
 * Auth Module.
 *
 * SOLID: Single Responsibility Principle (SRP)
 * - Encapsulates all authentication-related providers and configuration.
 *
 * SOLID: Open/Closed Principle (OCP)
 * - New auth strategies can be added without modifying existing code.
 */

import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { AuthController } from './auth.controller.js';
import { AuthService } from './auth.service.js';
import { JwtStrategy } from './strategies/jwt.strategy.js';
import { User } from '../../entities/user.entity.js';
import { UserRole } from '../../entities/user-role.entity.js';

@Module({
  imports: [
    TypeOrmModule.forFeature([User, UserRole]),
    PassportModule.register({ defaultStrategy: 'jwt' }),
    JwtModule.registerAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        secret: configService.get<string>('JWT_SECRET', 'default-secret'),
        signOptions: {
          expiresIn: configService.get<number>('JWT_EXPIRATION', 3600),
        },
      }),
    }),
  ],
  controllers: [AuthController],
  providers: [AuthService, JwtStrategy],
  exports: [AuthService, JwtModule, PassportModule],
})
export class AuthModule {}
