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
import { Profile } from '../../entities/profile.entity.js';
import { UserRole } from '../../entities/user-role.entity.js';
import { Role } from '../../common/enums/index.js';
import { SignInDto, SignUpDto } from './dto/auth.dto.js';

@Injectable()
export class AuthService {
  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    @InjectRepository(Profile)
    private readonly profileRepository: Repository<Profile>,
    @InjectRepository(UserRole)
    private readonly userRoleRepository: Repository<UserRole>,
    private readonly jwtService: JwtService,
  ) {}

  async signIn(dto: SignInDto) {
    const user = await this.userRepository.findOne({
      where: { email: dto.email },
      relations: ['profile', 'userRoles'],
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
      refresh_token: this.jwtService.sign(payload, { expiresIn: '7d' }),
      user: this.toAuthUser(user, user.email),
    };
  }

  async signUp(dto: SignUpDto) {
    const existingUser = await this.userRepository.findOne({
      where: { email: dto.email },
    });

    if (existingUser) {
      throw new ConflictException('Email already registered');
    }

    const hashedPassword = await bcrypt.hash(dto.password, 10);

    const user = this.userRepository.create({
      email: dto.email,
      password: hashedPassword,
    });
    const savedUser = await this.userRepository.save(user);

    const profile = this.profileRepository.create({
      userId: savedUser.id,
      displayName: dto.display_name,
      avatarUrl: null,
      phone: null,
    });
    await this.profileRepository.save(profile);

    const userRole = this.userRoleRepository.create({
      userId: savedUser.id,
      role: Role.SERVER,
    });
    await this.userRoleRepository.save(userRole);

    const createdUser = await this.getUserWithRoles(savedUser.id);
    const roles = createdUser?.userRoles.map((ur) => ur.role) ?? [Role.SERVER];
    const payload = { sub: savedUser.id, email: savedUser.email, roles };

    return {
      user_id: savedUser.id,
      email_verification_required: false,
      access_token: this.jwtService.sign(payload),
      refresh_token: this.jwtService.sign(payload, { expiresIn: '7d' }),
      user: this.toAuthUser(createdUser, savedUser.email, dto.display_name),
    };
  }

  async getMe(userId: string, email?: string | null) {
    const user = await this.getUserWithRoles(userId);

    if (!user) {
      throw new UnauthorizedException('User not found');
    }

    return this.toAuthUser(user, email ?? user.email);
  }

  private async getUserWithRoles(userId: string) {
    return this.userRepository.findOne({
      where: { id: userId },
      relations: ['profile', 'userRoles'],
    });
  }

  private toAuthUser(
    user: User | null,
    email: string | null,
    fallbackDisplayName?: string,
  ) {
    return {
      id: user?.id ?? '',
      email,
      display_name: user?.profile?.displayName ?? fallbackDisplayName ?? '',
      phone: user?.profile?.phone ?? null,
      avatar_url: user?.profile?.avatarUrl ?? null,
      roles: user?.userRoles.map((ur) => ur.role) ?? [],
    };
  }
}
