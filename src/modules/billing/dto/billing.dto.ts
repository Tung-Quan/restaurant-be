/**
 * Billing DTOs.
 *
 * SOLID: Single Responsibility Principle (SRP)
 * - Validates the payment creation request.
 */

import { IsEnum, IsNotEmpty, IsNumber, Min } from 'class-validator';
import { PaymentMethod } from '../../../common/enums/index.js';

export class CreatePaymentDto {
  @IsEnum(PaymentMethod)
  @IsNotEmpty()
  method: PaymentMethod;

  @IsNumber()
  @Min(0)
  amount: number;
}
