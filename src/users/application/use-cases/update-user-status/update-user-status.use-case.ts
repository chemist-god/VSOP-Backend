import { Inject, Injectable } from '@nestjs/common';
import { PrismaService } from '../../../../prisma/prisma.service';
import { USER_REPOSITORY_PORT, UserRepositoryPort } from '@users/application/ports/user-repository.port';
import { CannotDeactivateSelfError } from '@users/domain/errors/cannot-deactivate-self.error';
import { UserNotFoundError } from '@users/domain/errors/user-not-found.error';

@Injectable()
export class UpdateUserStatusUseCase {
  constructor(
    @Inject(USER_REPOSITORY_PORT) private readonly userRepo: UserRepositoryPort,
    private readonly prisma: PrismaService,
  ) {}

  async execute(
    actorId: string,
    userId: string,
    isActive: boolean,
  ): Promise<{ id: string; isActive: boolean }> {
    if (!isActive && actorId === userId) {
      throw new CannotDeactivateSelfError();
    }

    const user = await this.userRepo.findById(userId);
    if (!user) {
      throw new UserNotFoundError(userId);
    }

    const before = { isActive: user.isActive };

    if (isActive) {
      user.activate();
    } else {
      user.deactivate();
    }

    await this.userRepo.save(user);

    if (!isActive) {
      await this.prisma.assignment.updateMany({
        where: { assigneeId: userId, isActive: true },
        data: { isActive: false },
      });
    }

    await this.prisma.auditLog.create({
      data: {
        entityType: 'user',
        entityId: userId,
        action: isActive ? 'user.activated' : 'user.deactivated',
        actorId,
        actorType: 'USER',
        beforeState: before,
        afterState: { isActive: user.isActive },
      },
    });

    return { id: user.id, isActive: user.isActive };
  }
}
