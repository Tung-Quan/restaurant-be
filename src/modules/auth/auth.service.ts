/**
 * Auth Service.
 *
 * SOLID: Single Responsibility Principle (SRP)
 * - Handles authentication logic: sign-in, sign-up, token generation, user retrieval.
 *
 * SOLID: Dependency Inversion Principle (DIP)
 * - Depends on Repository<User> and JwtService abstractions, not concrete DB implementations.
 */

import {
  Injectable,
  UnauthorizedException,
  ConflictException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as bcrypt from 'bcrypt';
import { User } from '../../entities/user.entity.js';
import { UserRole } from '../../entities/user-role.entity.js';
import { Role } from '../../common/enums/index.js';
import { SignInDto, SignUpDto } from './dto/auth.dto.js';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class AuthService {
  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    @InjectRepository(UserRole)
    private readonly userRoleRepository: Repository<UserRole>,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
  ) {}

  async signIn(dto: SignInDto) {
    const user = await this.userRepository.findOne({
      where: { email: dto.email },
      relations: ['userRoles'],
    });

    if (!user) {
      throw new UnauthorizedException('Invalid email or password');
    }

    const isPasswordValid = await bcrypt.compare(dto.password, user.password);
    if (!isPasswordValid) {
      throw new UnauthorizedException('Invalid email or password');
    }

    const roles = user.userRoles.map((ur) => ur.role);
    const payload = { sub: user.id, email: user.email, roles };

    return {
      access_token: this.jwtService.sign(payload),
      refresh_token: this.jwtService.sign(payload, {
        secret: this.configService.get<string>('JWT_REFRESH_SECRET'),
        expiresIn: 604800, // 7 days in seconds
      }),
      user: {
        id: user.id,
        email: user.email,
        display_name: user.displayName,
        roles,
      },
    };
  }

  async signUp(dto: SignUpDto) {
    const existing = await this.userRepository.findOne({
      where: { email: dto.email },
    });

    if (existing) {
      throw new ConflictException('Email already registered');
    }

    const hashedPassword = await bcrypt.hash(dto.password, 10);

    const user = this.userRepository.create({
      email: dto.email,
      password: hashedPassword,
      displayName: dto.display_name,
    });

    const savedUser = await this.userRepository.save(user);

    // Assign default role
    const userRole = this.userRoleRepository.create({
      userId: savedUser.id,
      role: Role.SERVER,
    });
    await this.userRoleRepository.save(userRole);

    return {
      user_id: savedUser.id,
      email_verification_required: true,
    };
  }

  async getMe(userId: string) {
    const user = await this.userRepository.findOne({
      where: { id: userId },
      relations: ['userRoles'],
    });

    if (!user) {
      throw new UnauthorizedException('User not found');
    }

    return {
      id: user.id,
      email: user.email,
      display_name: user.displayName,
      phone: user.phone,
      avatar_url: user.avatarUrl,
      roles: user.userRoles.map((ur) => ur.role),
    };
  }
}
