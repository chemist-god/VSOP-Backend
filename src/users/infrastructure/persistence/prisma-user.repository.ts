import { Injectable } from '@nestjs/common';
import { UserRole } from '@prisma/client';
import { PrismaService } from '../../../prisma/prisma.service';
import { User } from '@users/domain/entities/user.entity';
import { EmailAddress } from '@users/domain/value-objects/email-address.vo';
import { UserRepositoryPort } from '@users/application/ports/user-repository.port';

@Injectable()
export class PrismaUserRepository implements UserRepositoryPort {
  constructor(private readonly prisma: PrismaService) {}

  private toDomain(raw: {
    id: string;
    name: string;
    email: string;
    passwordHash: string;
    role: UserRole;
    isActive: boolean;
    resetToken: string | null;
    resetTokenAt: Date | null;
    createdAt: Date;
    updatedAt: Date;
  }): User {
    return User.create(
      {
        name: raw.name,
        email: EmailAddress.create(raw.email),
        passwordHash: raw.passwordHash,
        role: raw.role,
        isActive: raw.isActive,
        resetToken: raw.resetToken,
        resetTokenAt: raw.resetTokenAt,
        createdAt: raw.createdAt,
        updatedAt: raw.updatedAt,
      },
      raw.id,
    );
  }

  async save(user: User): Promise<void> {
    await this.prisma.user.upsert({
      where: { id: user.id },
      update: {
        name: user.name,
        email: user.email.value,
        passwordHash: user.passwordHash,
        role: user.role,
        isActive: user.isActive,
        resetToken: user.resetToken ?? null,
        resetTokenAt: user.resetTokenAt ?? null,
      },
      create: {
        id: user.id,
        name: user.name,
        email: user.email.value,
        passwordHash: user.passwordHash,
        role: user.role,
        isActive: user.isActive,
      },
    });
  }

  async findById(id: string): Promise<User | null> {
    const raw = await this.prisma.user.findUnique({ where: { id } });
    return raw ? this.toDomain(raw) : null;
  }

  async findByEmail(email: string): Promise<User | null> {
    const raw = await this.prisma.user.findUnique({ where: { email } });
    return raw ? this.toDomain(raw) : null;
  }

  async findByResetToken(token: string): Promise<User | null> {
    const raw = await this.prisma.user.findFirst({ where: { resetToken: token } });
    return raw ? this.toDomain(raw) : null;
  }

  async findAll(): Promise<User[]> {
    const rows = await this.prisma.user.findMany({ orderBy: { createdAt: 'desc' } });
    return rows.map((row) => this.toDomain(row));
  }

  async exists(email: string): Promise<boolean> {
    const count = await this.prisma.user.count({ where: { email } });
    return count > 0;
  }
}
