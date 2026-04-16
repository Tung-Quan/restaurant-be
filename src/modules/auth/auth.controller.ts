/**
 * Auth Controller.
 *
 * SOLID: Single Responsibility Principle (SRP)
 * - Handles HTTP layer for authentication endpoints only.
 *
 * SOLID: Dependency Inversion Principle (DIP)
 * - Depends on AuthService abstraction, not on database or JWT details directly.
 */

import {
  Controller,
  Post,
  Get,
  Body,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { AuthService } from './auth.service.js';
import { SignInDto, SignUpDto } from './dto/auth.dto.js';
import { JwtAuthGuard } from './guards/jwt-auth.guard.js';
import { CurrentUser } from '../../common/decorators/current-user.decorator.js';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('sign-in')
  @HttpCode(HttpStatus.OK)
  signIn(@Body() dto: SignInDto) {
    return this.authService.signIn(dto);
  }

  @Post('sign-up')
  signUp(@Body() dto: SignUpDto) {
    return this.authService.signUp(dto);
  }

  @Post('sign-out')
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.OK)
  signOut() {
    // JWT is stateless; client removes token. Could implement token blacklist here.
    return { message: 'Signed out successfully' };
  }

  @Get('me')
  @UseGuards(JwtAuthGuard)
  getMe(@CurrentUser() user: { id: string; email?: string | null }) {
    return this.authService.getMe(user.id, user.email ?? null);
  }
}
