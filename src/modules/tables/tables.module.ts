/**
 * Tables Module.
 *
 * SOLID: Single Responsibility Principle (SRP)
 * - Encapsulates table management concerns.
 */

import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { TablesController } from './tables.controller.js';
import { TablesService } from './tables.service.js';
import { RestaurantTable } from '../../entities/table.entity.js';

@Module({
  imports: [TypeOrmModule.forFeature([RestaurantTable])],
  controllers: [TablesController],
  providers: [TablesService],
  exports: [TablesService],
})
export class TablesModule {}
