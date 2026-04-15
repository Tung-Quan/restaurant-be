/**
 * Database configuration factory.
 *
 * SOLID: Single Responsibility Principle (SRP)
 * - This file has one job: providing TypeORM configuration from environment variables.
 *
 * SOLID: Dependency Inversion Principle (DIP)
 * - Uses ConfigService abstraction rather than reading process.env directly.
 */

import { TypeOrmModuleOptions } from '@nestjs/typeorm';
import { ConfigService } from '@nestjs/config';

export const getDatabaseConfig = (
  configService: ConfigService,
): TypeOrmModuleOptions => ({
  type: 'postgres',
  host: configService.get<string>('DB_HOST', 'localhost'),
  port: configService.get<number>('DB_PORT', 5432),
  username: configService.get<string>('DB_USERNAME', 'postgres'),
  password: configService.get<string>('DB_PASSWORD', 'postgres'),
  database: configService.get<string>('DB_NAME', 'restaurant_db'),
  entities: [__dirname + '/../entities/*.entity{.ts,.js}'],
  synchronize: configService.get<string>('NODE_ENV') !== 'production',
  logging: configService.get<string>('NODE_ENV') === 'development',
});
