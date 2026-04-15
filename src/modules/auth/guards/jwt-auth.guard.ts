/**
 * JWT Auth Guard.
 *
 * SOLID: Liskov Substitution Principle (LSP)
 * - Extends AuthGuard('jwt') and can be used wherever a guard is expected.
 *
 * SOLID: Single Responsibility Principle (SRP)
 * - Only responsible for JWT authentication check.
 */

import { Injectable } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';

@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt') {}
