/**
 * Admin DTOs.
 *
 * SOLID: Single Responsibility Principle (SRP)
 * - Each DTO validates one specific admin request shape.
 */

import { IsEnum, IsNotEmpty } from 'class-validator';
import { Role } from '../../../common/enums/index.js';

export class AssignRoleDto {
  @IsEnum(Role)
  @IsNotEmpty()
  role: Role;
}
