/**
 * Kitchen DTOs.
 *
 * SOLID: Single Responsibility Principle (SRP)
 * - Validates the order item status update request.
 */

import { IsEnum, IsNotEmpty } from 'class-validator';
import { OrderItemStatus } from '../../../common/enums/index.js';

export class UpdateOrderItemStatusDto {
  @IsEnum(OrderItemStatus)
  @IsNotEmpty()
  status: OrderItemStatus;
}
