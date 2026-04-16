/**
 * Application Bootstrap.
 *
 * SOLID: Single Responsibility Principle (SRP)
 * - This file has one job: bootstrapping the NestJS application with
 *   global pipes, filters, interceptors, and CORS configuration.
 */

import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { AppModule } from './app.module.js';
import { TransformResponseInterceptor } from './common/interceptors/transform-response.interceptor.js';
import { GlobalExceptionFilter } from './common/filters/global-exception.filter.js';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // Global API prefix
  app.setGlobalPrefix('api/v1');

  // Enable CORS for frontend
  app.enableCors({
    origin: true,
    credentials: true,
  });

  // Global validation pipe (class-validator)
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
      transformOptions: {
        enableImplicitConversion: true,
      },
    }),
  );

  // Global response transformer
  app.useGlobalInterceptors(new TransformResponseInterceptor());

  // Global exception filter
  app.useGlobalFilters(new GlobalExceptionFilter());

  const port = process.env.PORT ?? 3000;
  await app.listen(port);
  console.log(`🚀 IRMS Backend running on http://localhost:${port}/api/v1`);
}
void bootstrap();
