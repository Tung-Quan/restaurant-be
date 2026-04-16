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

const getDatabaseUrl = (configService: ConfigService): string | undefined =>
  configService.get<string>('DATABASE_URL') ||
  configService.get<string>('SUPABASE_DB_URL');

const shouldUseSsl = (
  configService: ConfigService,
  databaseUrl?: string,
): boolean => {
  const sslEnv = configService.get<string>('DB_SSL');

  if (sslEnv !== undefined) {
    return sslEnv === 'true';
  }

  return Boolean(databaseUrl?.includes('supabase.com'));
};

const shouldSynchronize = (
  configService: ConfigService,
  databaseUrl?: string,
): boolean => {
  const synchronizeEnv = configService.get<string>('DB_SYNCHRONIZE');

  if (synchronizeEnv !== undefined) {
    return synchronizeEnv === 'true';
  }

  if (databaseUrl?.includes('supabase.com')) {
    return false;
  }

  return configService.get<string>('NODE_ENV') !== 'production';
};

export const getDatabaseConfig = (
  configService: ConfigService,
): TypeOrmModuleOptions => {
  const databaseUrl = getDatabaseUrl(configService);
  const useSsl = shouldUseSsl(configService, databaseUrl);
  const synchronize = shouldSynchronize(configService, databaseUrl);

  return {
    type: 'postgres',
    url: databaseUrl,
    host: configService.get<string>('DB_HOST', 'localhost'),
    port: configService.get<number>('DB_PORT', 5432),
    username: configService.get<string>('DB_USERNAME', 'postgres'),
    password: configService.get<string>('DB_PASSWORD', 'postgres'),
    database: configService.get<string>('DB_NAME', 'restaurant_db'),
    ssl: useSsl ? { rejectUnauthorized: false } : false,
    entities: [__dirname + '/../entities/*.entity{.ts,.js}'],
    synchronize,
    logging: configService.get<string>('NODE_ENV') === 'development',
  };
};
