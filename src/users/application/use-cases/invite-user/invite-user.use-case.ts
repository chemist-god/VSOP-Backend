import { createHash, randomBytes } from 'crypto';
import { BadRequestException, Inject, Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../../../../prisma/prisma.service';
import { USER_REPOSITORY_PORT, UserRepositoryPort } from '@users/application/ports/user-repository.port';
import { ID_GENERATOR_PORT, IdGeneratorPort } from '@shared/application/ports/id-generator.port';
import { CLOCK_PORT, ClockPort } from '@shared/application/ports/clock.port';
import { EmailAddress } from '@users/domain/value-objects/email-address.vo';
import { DuplicateEmailError } from '@users/domain/errors/duplicate-email.error';
import { NOTIFICATION_PORT, NotificationPort } from '@notifications/application/ports/notification.port';
import { InviteUserCommand } from './invite-user.command';

function hashToken(token: string): string {
  return createHash('sha256').update(token).digest('hex');
}

@Injectable()
export class InviteUserUseCase {
  constructor(
    private readonly prisma: PrismaService,
    @Inject(USER_REPOSITORY_PORT) private readonly userRepo: UserRepositoryPort,
    @Inject(ID_GENERATOR_PORT) private readonly idGen: IdGeneratorPort,
    @Inject(CLOCK_PORT) private readonly clock: ClockPort,
    @Inject(NOTIFICATION_PORT) private readonly notifications: NotificationPort,
    private readonly config: ConfigService,
  ) {}

  async execute(command: InviteUserCommand): Promise<{ invitationId: string; expiresAt: Date }> {
    const emailVo = EmailAddress.create(command.email);
    const email = emailVo.value;

    if (await this.userRepo.exists(email)) {
      throw new DuplicateEmailError(email);
    }

    const pending = await this.prisma.userInvitation.findFirst({
      where: { email, acceptedAt: null, expiresAt: { gt: this.clock.now() } },
    });
    if (pending) {
      throw new BadRequestException({
        code: 'INVITE_PENDING',
        message: 'An active invitation already exists for this email.',
      });
    }

    const inviter = await this.userRepo.findById(command.invitedById);
    if (!inviter) {
      throw new BadRequestException({
        code: 'INVALID_INVITER',
        message: 'Inviter not found.',
      });
    }

    const plaintextToken = randomBytes(32).toString('hex');
    const expiryHours = this.config.get<number>('invites.expiryHours') ?? 48;
    const expiresAt = new Date(this.clock.now().getTime() + expiryHours * 3_600_000);
    const invitationId = this.idGen.generate();

    await this.prisma.userInvitation.create({
      data: {
        id: invitationId,
        name: command.name.trim(),
        email,
        role: command.role,
        tokenHash: hashToken(plaintextToken),
        expiresAt,
        invitedById: command.invitedById,
      },
    });

    const frontendUrl =
      this.config.get<string>('appUrls.frontendUrl') ?? 'http://localhost:3000';
    const acceptUrl = `${frontendUrl}/invite/accept?token=${plaintextToken}`;

    await this.notifications.sendInviteNotification({
      inviteeName: command.name.trim(),
      inviteeEmail: email,
      inviterName: inviter.name,
      role: command.role,
      acceptUrl,
      expiresAt,
    });

    await this.prisma.auditLog.create({
      data: {
        entityType: 'user_invitation',
        entityId: invitationId,
        action: 'user.invited',
        actorId: command.invitedById,
        actorType: 'USER',
        afterState: { email, role: command.role, expiresAt },
      },
    });

    return { invitationId, expiresAt };
  }
}
