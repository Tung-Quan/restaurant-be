/**
 * Menu Module.
 *
 * SOLID: Single Responsibility Principle (SRP)
 * - Encapsulates menu-related concerns.
 */

import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { MenuController } from './menu.controller.js';
import { MenuService } from './menu.service.js';
import { MenuItem } from '../../entities/menu-item.entity.js';
import { MenuCategory } from '../../entities/menu-category.entity.js';

@Module({
  imports: [TypeOrmModule.forFeature([MenuItem, MenuCategory])],
  controllers: [MenuController],
  providers: [MenuService],
  exports: [MenuService],
})
export class MenuModule {}
