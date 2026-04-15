/**
 * Tables Service.
 *
 * SOLID: Single Responsibility Principle (SRP)
 * - Manages table-related business logic only.
 *
 * SOLID: Dependency Inversion Principle (DIP)
 * - Depends on Repository abstraction from TypeORM, not on concrete DB driver.
 */

import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { RestaurantTable } from '../../entities/table.entity.js';
import { TableStatus } from '../../common/enums/index.js';
import { CreateTableDto, UpdateTableStatusDto } from './dto/table.dto.js';

@Injectable()
export class TablesService {
  constructor(
    @InjectRepository(RestaurantTable)
    private readonly tableRepository: Repository<RestaurantTable>,
  ) {}

  async findAll(sort?: string): Promise<RestaurantTable[]> {
    const order: Record<string, 'ASC' | 'DESC'> = {};
    if (sort === 'table_number') {
      order['tableNumber'] = 'ASC';
    } else {
      order['tableNumber'] = 'ASC';
    }
    return this.tableRepository.find({ order });
  }

  async updateStatus(
    id: string,
    dto: UpdateTableStatusDto,
  ): Promise<{ id: string; status: TableStatus }> {
    const table = await this.tableRepository.findOne({ where: { id } });
    if (!table) {
      throw new NotFoundException('Table not found');
    }

    table.status = dto.status;
    await this.tableRepository.save(table);

    return { id: table.id, status: table.status };
  }

  async create(dto: CreateTableDto): Promise<RestaurantTable> {
    const table = this.tableRepository.create({
      tableNumber: dto.table_number,
      capacity: dto.capacity,
      locationZone: dto.location_zone || 'main',
    });
    return this.tableRepository.save(table);
  }

  async countAvailable(): Promise<number> {
    return this.tableRepository.count({
      where: { status: TableStatus.AVAILABLE },
    });
  }
}
