/**
 * Roles Decorator.
 *
 * SOLID: Open/Closed Principle (OCP)
 * - New roles can be added to the Role enum without changing this decorator.
 *
 * SOLID: Interface Segregation Principle (ISP)
 * - This decorator only concerns itself with role metadata, nothing else.
 */

import { SetMetadata } from '@nestjs/common';
import { Role } from '../enums/index.js';

export const ROLES_KEY = 'roles';
export const Roles = (...roles: Role[]) => SetMetadata(ROLES_KEY, roles);
