import { BadRequestException, Inject, Injectable, UnauthorizedException } from '@nestjs/common';
import { USER_REPOSITORY_PORT, UserRepositoryPort } from '@users/application/ports/user-repository.port';
import { PASSWORD_HASHER_PORT, PasswordHasherPort } from '@shared/application/ports/password-hasher.port';
import { UserNotFoundError } from '@users/domain/errors/user-not-found.error';

@Injectable()
export class GetMeUseCase {
  constructor(@Inject(USER_REPOSITORY_PORT) private readonly userRepo: UserRepositoryPort) {}

  async execute(userId: string) {
    const user = await this.userRepo.findById(userId);
    if (!user) throw new UserNotFoundError(userId);
    return {
      id: user.id,
      name: user.name,
      email: user.email.value,
      role: user.role,
      isActive: user.isActive,
      createdAt: user.createdAt,
    };
  }
}

@Injectable()
export class UpdateMeUseCase {
  constructor(@Inject(USER_REPOSITORY_PORT) private readonly userRepo: UserRepositoryPort) {}

  async execute(userId: string, name: string) {
    const user = await this.userRepo.findById(userId);
    if (!user) throw new UserNotFoundError(userId);
    if (!name?.trim() || name.trim().length < 2) {
      throw new BadRequestException({
        code: 'VALIDATION_ERROR',
        message: 'Name must be at least 2 characters.',
      });
    }
    user.updateName(name);
    await this.userRepo.save(user);
    return {
      id: user.id,
      name: user.name,
      email: user.email.value,
      role: user.role,
    };
  }
}

@Injectable()
export class ChangeMyPasswordUseCase {
  constructor(
    @Inject(USER_REPOSITORY_PORT) private readonly userRepo: UserRepositoryPort,
    @Inject(PASSWORD_HASHER_PORT) private readonly hasher: PasswordHasherPort,
  ) {}

  async execute(userId: string, currentPassword: string, newPassword: string) {
    const user = await this.userRepo.findById(userId);
    if (!user) throw new UserNotFoundError(userId);

    const valid = await this.hasher.compare(currentPassword, user.passwordHash);
    if (!valid) {
      throw new UnauthorizedException({
        code: 'INVALID_PASSWORD',
        message: 'Current password is incorrect.',
      });
    }

    if (!newPassword || newPassword.length < 8) {
      throw new BadRequestException({
        code: 'WEAK_PASSWORD',
        message: 'New password must be at least 8 characters.',
      });
    }

    const passwordHash = await this.hasher.hash(newPassword);
    user.updatePasswordHash(passwordHash);
    await this.userRepo.save(user);
    return { success: true };
  }
}
