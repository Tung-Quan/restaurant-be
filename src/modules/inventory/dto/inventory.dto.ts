/**
 * Inventory DTOs.
 *
 * SOLID: Single Responsibility Principle (SRP)
 * - Each DTO validates one specific request shape.
 */

import {
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  Min,
} from 'class-validator';

export class CreateInventoryItemDto {
  @IsString()
  @IsNotEmpty()
  name: string;

  @IsString()
  @IsNotEmpty()
  unit: string;

  @IsNumber()
  @Min(0)
  quantity: number;

  @IsNumber()
  @IsOptional()
  min_threshold?: number;

  @IsString()
  @IsOptional()
  supplier?: string;

  @IsNumber()
  @IsOptional()
  cost_per_unit?: number;
}

export class UpdateInventoryQuantityDto {
  @IsNumber()
  @Min(0)
  quantity: number;
}
