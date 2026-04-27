/**
 * Billing DTOs.
 *
 * SOLID: Single Responsibility Principle (SRP)
 * - Validates the payment creation request.
 */

import {
  IsArray,
  IsEnum,
  IsIn,
  IsInt,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  IsUUID,
  Min,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';
import { PaymentMethod } from '../../../common/enums/index.js';

export class CreatePaymentDto {
  @IsEnum(PaymentMethod)
  @IsNotEmpty()
  method: PaymentMethod;

  @IsNumber()
  @Min(0)
  amount: number;

  @IsNumber()
  @Min(0)
  @IsOptional()
  tip_amount?: number;

  @IsString()
  @IsOptional()
  promotion_code?: string;
}

export class SplitBillPartyDto {
  @IsString()
  @IsNotEmpty()
  party_name: string;

  @IsArray()
  @IsUUID('4', { each: true })
  item_ids: string[];
}

export class SplitBillDto {
  @IsIn(['even', 'items'])
  mode: 'even' | 'items';

  @IsInt()
  @Min(2)
  @IsOptional()
  guest_count?: number;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => SplitBillPartyDto)
  @IsOptional()
  parties?: SplitBillPartyDto[];
}
