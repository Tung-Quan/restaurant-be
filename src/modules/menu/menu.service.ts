/**
 * Menu Service.
 *
 * SOLID: Single Responsibility Principle (SRP)
 * - Handles business logic for menu items and categories.
 *
 * SOLID: Dependency Inversion Principle (DIP)
 * - Depends on Repository abstractions.
 */

import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { MenuItem } from '../../entities/menu-item.entity.js';
import { MenuCategory } from '../../entities/menu-category.entity.js';
import {
  CreateMenuItemDto,
  CreateMenuCategoryDto,
  UpdateMenuItemAvailabilityDto,
} from './dto/menu.dto.js';

@Injectable()
export class MenuService {
  constructor(
    @InjectRepository(MenuItem)
    private readonly menuItemRepository: Repository<MenuItem>,
    @InjectRepository(MenuCategory)
    private readonly categoryRepository: Repository<MenuCategory>,
  ) {}

  async findAllItems(
    isAvailable?: boolean,
    includeCategory?: boolean,
  ): Promise<MenuItem[]> {
    const where: Record<string, any> = {};
    if (isAvailable !== undefined) {
      where.isAvailable = isAvailable;
    }

    const relations: string[] = [];
    if (includeCategory) {
      relations.push('category');
    }

    return this.menuItemRepository.find({ where, relations });
  }

  async createItem(dto: CreateMenuItemDto): Promise<MenuItem> {
    const category = await this.categoryRepository.findOne({
      where: { id: dto.category_id },
    });
    if (!category) {
      throw new NotFoundException('Category not found');
    }

    const item = this.menuItemRepository.create({
      name: dto.name,
      description: dto.description || null,
      price: dto.price,
      categoryId: dto.category_id,
      imageUrl: dto.image_url || null,
      isAvailable: dto.is_available ?? true,
      prepTimeMinutes: dto.prep_time_minutes ?? 15,
    });

    return this.menuItemRepository.save(item);
  }

  async updateAvailability(
    id: string,
    dto: UpdateMenuItemAvailabilityDto,
  ): Promise<{ id: string; is_available: boolean }> {
    const item = await this.menuItemRepository.findOne({ where: { id } });
    if (!item) {
      throw new NotFoundException('Menu item not found');
    }

    item.isAvailable = dto.is_available;
    await this.menuItemRepository.save(item);

    return { id: item.id, is_available: item.isAvailable };
  }

  async findAllCategories(): Promise<MenuCategory[]> {
    return this.categoryRepository.find({ order: { sortOrder: 'ASC' } });
  }

  async createCategory(dto: CreateMenuCategoryDto): Promise<MenuCategory> {
    const category = this.categoryRepository.create({
      name: dto.name,
      description: dto.description || null,
      sortOrder: dto.sort_order ?? 0,
    });
    return this.categoryRepository.save(category);
  }
}
