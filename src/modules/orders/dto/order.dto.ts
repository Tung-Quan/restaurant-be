/**
 * Order DTOs.
 *
 * SOLID: Single Responsibility Principle (SRP)
 * - Each DTO validates one specific request shape.
 */

import {
  IsObject,
  IsArray,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  IsUUID,
  Min,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';

export class CreateOrderItemDto {
  @IsUUID()
  menu_item_id: string;

  @IsNumber()
  @Min(1)
  quantity: number;

  @IsNumber()
  @Min(0)
  unit_price: number;

  @IsString()
  @IsOptional()
  notes?: string;

  @IsObject()
  @IsOptional()
  customizations?: Record<string, unknown>;
}

export class CreateOrderDto {
  @IsUUID()
  @IsNotEmpty()
  table_id: string;

  @IsString()
  @IsOptional()
  special_instructions?: string;

  @IsString()
  @IsOptional()
  order_type?: string;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateOrderItemDto)
  items: CreateOrderItemDto[];
}
