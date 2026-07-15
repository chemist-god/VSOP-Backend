import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import {
  IN_APP_NOTIFICATION_REPOSITORY_PORT,
  InAppNotificationRepositoryPort,
} from '@notifications/application/ports/in-app-notification-repository.port';

@Injectable()
export class MarkNotificationReadUseCase {
  constructor(
    @Inject(IN_APP_NOTIFICATION_REPOSITORY_PORT)
    private readonly repo: InAppNotificationRepositoryPort,
  ) {}

  async execute(id: string, userId: string) {
    const item = await this.repo.markRead(id, userId);
    if (!item) throw new NotFoundException('Notification not found');
    return {
      id: item.id,
      readAt: item.readAt?.toISOString() ?? null,
    };
  }
}

@Injectable()
export class MarkAllNotificationsReadUseCase {
  constructor(
    @Inject(IN_APP_NOTIFICATION_REPOSITORY_PORT)
    private readonly repo: InAppNotificationRepositoryPort,
  ) {}

  async execute(userId: string) {
    const count = await this.repo.markAllRead(userId);
    return { marked: count };
  }
}
