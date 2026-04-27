/**
 * Inventory Service.
 *
 * SOLID: Single Responsibility Principle (SRP)
 * - Handles inventory business logic only.
 *
 * SOLID: Dependency Inversion Principle (DIP)
 * - Depends on Repository abstraction.
 */

import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { InventoryItem } from '../../entities/inventory-item.entity.js';
import {
  CreateInventoryItemDto,
  UpdateInventoryQuantityDto,
} from './dto/inventory.dto.js';

@Injectable()
export class InventoryService {
  constructor(
    @InjectRepository(InventoryItem)
    private readonly inventoryRepository: Repository<InventoryItem>,
  ) {}

  async findAll(sort?: string) {
    const order: Record<string, 'ASC' | 'DESC'> = {};
    if (sort === 'name') {
      order['name'] = 'ASC';
    } else {
      order['name'] = 'ASC';
    }

    const items = await this.inventoryRepository.find({ order });

    return items.map((item) => ({
      id: item.id,
      name: item.name,
      unit: item.unit,
      quantity: Number(item.quantity),
      min_threshold: Number(item.minThreshold),
      supplier: item.supplier,
      cost_per_unit: Number(item.costPerUnit),
      last_restocked_at: item.lastRestockedAt,
    }));
  }

  async create(dto: CreateInventoryItemDto) {
    const item = this.inventoryRepository.create({
      name: dto.name,
      unit: dto.unit,
      quantity: dto.quantity,
      minThreshold: dto.min_threshold ?? 0,
      supplier: dto.supplier || null,
      costPerUnit: dto.cost_per_unit ?? 0,
    });

    const saved = await this.inventoryRepository.save(item);

    return {
      id: saved.id,
      name: saved.name,
    };
  }

  async updateQuantity(id: string, dto: UpdateInventoryQuantityDto) {
    const item = await this.inventoryRepository.findOne({ where: { id } });
    if (!item) {
      throw new NotFoundException('Inventory item not found');
    }

    item.quantity = dto.quantity;
    await this.inventoryRepository.save(item);

    return {
      id: item.id,
      quantity: Number(item.quantity),
    };
  }

  async findLowStock() {
    const items = await this.inventoryRepository
      .createQueryBuilder('item')
      .where('item.quantity <= item.minThreshold')
      .orderBy('item.name', 'ASC')
      .getMany();

    return items.map((item) => this.toResponse(item));
  }

  async countLowStock(): Promise<number> {
    // Count items where quantity <= min_threshold
    const items = await this.inventoryRepository
      .createQueryBuilder('item')
      .where('item.quantity <= item.minThreshold')
      .getCount();

    return items;
  }

  private toResponse(item: InventoryItem) {
    return {
      id: item.id,
      name: item.name,
      unit: item.unit,
      quantity: Number(item.quantity),
      min_threshold: Number(item.minThreshold),
      supplier: item.supplier,
      cost_per_unit: Number(item.costPerUnit),
      last_restocked_at: item.lastRestockedAt,
    };
  }
}
