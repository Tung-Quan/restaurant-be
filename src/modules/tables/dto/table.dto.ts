/**
 * Table DTOs.
 *
 * SOLID: Single Responsibility Principle (SRP)
 * - Each DTO validates one specific request shape.
 */

import {
  IsEnum,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  Min,
} from 'class-validator';
import { TableStatus } from '../../../common/enums/index.js';

export class UpdateTableStatusDto {
  @IsEnum(TableStatus)
  @IsNotEmpty()
  status: TableStatus;
}

export class CreateTableDto {
  @IsNumber()
  @Min(1)
  table_number: number;

  @IsNumber()
  @Min(1)
  capacity: number;

  @IsString()
  @IsOptional()
  location_zone?: string;
}
