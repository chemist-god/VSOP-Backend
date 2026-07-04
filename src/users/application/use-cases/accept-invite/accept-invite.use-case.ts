import { createHash } from 'crypto';
import {
  BadRequestException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../../../../prisma/prisma.service';
import { USER_REPOSITORY_PORT, UserRepositoryPort } from '@users/application/ports/user-repository.port';
import { ID_GENERATOR_PORT, IdGeneratorPort } from '@shared/application/ports/id-generator.port';
import { PASSWORD_HASHER_PORT, PasswordHasherPort } from '@shared/application/ports/password-hasher.port';
import { CLOCK_PORT, ClockPort } from '@shared/application/ports/clock.port';
import { User } from '@users/domain/entities/user.entity';
import { EmailAddress } from '@users/domain/value-objects/email-address.vo';
import { DuplicateEmailError } from '@users/domain/errors/duplicate-email.error';

function hashToken(token: string): string {
  return createHash('sha256').update(token).digest('hex');
}

@Injectable()
export class GetInviteUseCase {
  constructor(private readonly prisma: PrismaService, @Inject(CLOCK_PORT) private readonly clock: ClockPort) {}

  async execute(token: string) {
    const invite = await this.prisma.userInvitation.findFirst({
      where: { tokenHash: hashToken(token) },
    });

    if (!invite || invite.acceptedAt) {
      throw new NotFoundException({
        code: 'INVITE_NOT_FOUND',
        message: 'Invitation not found or already used.',
      });
    }

    if (invite.expiresAt.getTime() < this.clock.now().getTime()) {
      throw new BadRequestException({
        code: 'INVITE_EXPIRED',
        message: 'This invitation has expired. Ask an admin to send a new one.',
      });
    }

    return {
      name: invite.name,
      email: invite.email,
      role: invite.role,
      expiresAt: invite.expiresAt,
    };
  }
}

@Injectable()
export class AcceptInviteUseCase {
  constructor(
    private readonly prisma: PrismaService,
    @Inject(USER_REPOSITORY_PORT) private readonly userRepo: UserRepositoryPort,
    @Inject(ID_GENERATOR_PORT) private readonly idGen: IdGeneratorPort,
    @Inject(PASSWORD_HASHER_PORT) private readonly hasher: PasswordHasherPort,
    @Inject(CLOCK_PORT) private readonly clock: ClockPort,
    private readonly jwtService: JwtService,
    private readonly config: ConfigService,
  ) {}

  async execute(token: string, password: string) {
    if (!password || password.length < 8) {
      throw new BadRequestException({
        code: 'WEAK_PASSWORD',
        message: 'Password must be at least 8 characters.',
      });
    }

    const invite = await this.prisma.userInvitation.findFirst({
      where: { tokenHash: hashToken(token) },
    });

    if (!invite || invite.acceptedAt) {
      throw new NotFoundException({
        code: 'INVITE_NOT_FOUND',
        message: 'Invitation not found or already used.',
      });
    }

    if (invite.expiresAt.getTime() < this.clock.now().getTime()) {
      throw new BadRequestException({
        code: 'INVITE_EXPIRED',
        message: 'This invitation has expired. Ask an admin to send a new one.',
      });
    }

    if (await this.userRepo.exists(invite.email)) {
      throw new DuplicateEmailError(invite.email);
    }

    const now = this.clock.now();
    const passwordHash = await this.hasher.hash(password);
    const userId = this.idGen.generate();

    const user = User.create(
      {
        name: invite.name,
        email: EmailAddress.create(invite.email),
        passwordHash,
        role: invite.role,
        isActive: true,
        createdAt: now,
        updatedAt: now,
      },
      userId,
    );

    await this.userRepo.save(user);

    await this.prisma.userInvitation.update({
      where: { id: invite.id },
      data: { acceptedAt: now },
    });

    await this.prisma.auditLog.create({
      data: {
        entityType: 'user',
        entityId: userId,
        action: 'user.invite_accepted',
        actorId: userId,
        actorType: 'USER',
        afterState: { email: invite.email, role: invite.role },
      },
    });

    const payload = { sub: user.id, email: user.email.value, role: user.role };
    const accessToken = this.jwtService.sign(payload, {
      secret: this.config.get<string>('jwt.secret'),
      expiresIn: this.config.get<string>('jwt.expiresIn'),
    });
    const refreshToken = this.jwtService.sign(payload, {
      secret: this.config.get<string>('jwt.refreshSecret'),
      expiresIn: this.config.get<string>('jwt.refreshExpiresIn'),
    });

    return {
      accessToken,
      refreshToken,
      user: {
        id: user.id,
        name: user.name,
        email: user.email.value,
        role: user.role,
      },
    };
  }
}
