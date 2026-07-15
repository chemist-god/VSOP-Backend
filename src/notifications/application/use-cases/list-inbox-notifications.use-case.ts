import { Inject, Injectable } from '@nestjs/common';
import {
  IN_APP_NOTIFICATION_REPOSITORY_PORT,
  InAppNotificationRepositoryPort,
} from '@notifications/application/ports/in-app-notification-repository.port';

@Injectable()
export class ListInboxNotificationsUseCase {
  constructor(
    @Inject(IN_APP_NOTIFICATION_REPOSITORY_PORT)
    private readonly repo: InAppNotificationRepositoryPort,
  ) {}

  async execute(userId: string) {
    const [items, unreadCount] = await Promise.all([
      this.repo.findByUserId(userId),
      this.repo.countUnread(userId),
    ]);

    return {
      unreadCount,
      items: items.map((item) => ({
        id: item.id,
        type: item.type,
        title: item.title,
        body: item.body,
        ticketId: item.ticketId,
        readAt: item.readAt?.toISOString() ?? null,
        createdAt: item.createdAt.toISOString(),
      })),
    };
  }
}
