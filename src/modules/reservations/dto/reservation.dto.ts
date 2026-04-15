/**
 * Reservation DTOs.
 *
 * SOLID: Single Responsibility Principle (SRP)
 * - Each DTO validates one specific request shape.
 */

import {
  IsDateString,
  IsEnum,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  Min,
} from 'class-validator';
import { ReservationStatus } from '../../../common/enums/index.js';

export class CreateReservationDto {
  @IsString()
  @IsNotEmpty()
  customer_name: string;

  @IsString()
  @IsOptional()
  customer_phone?: string;

  @IsNumber()
  @Min(1)
  party_size: number;

  @IsDateString()
  reservation_time: string;

  @IsString()
  @IsOptional()
  notes?: string;
}

export class UpdateReservationStatusDto {
  @IsEnum(ReservationStatus)
  @IsNotEmpty()
  status: ReservationStatus;
}
