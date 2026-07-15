import { Module } from '@nestjs/common';
import { NOTIFICATION_PORT } from './application/ports/notification.port';
import { IN_APP_NOTIFICATION_REPOSITORY_PORT } from './application/ports/in-app-notification-repository.port';
import { ResendNotificationAdapter } from './infrastructure/resend-notification.adapter';
import { PrismaInAppNotificationRepository } from './infrastructure/persistence/prisma-in-app-notification.repository';
import { ResolutionNotificationListener } from './application/listeners/resolution-notification.listener';
import { InAppNotificationListener } from './application/listeners/in-app-notification.listener';
import { ListInboxNotificationsUseCase } from './application/use-cases/list-inbox-notifications.use-case';
import {
  MarkAllNotificationsReadUseCase,
  MarkNotificationReadUseCase,
} from './application/use-cases/mark-notification-read.use-case';
import { InboxController } from './infrastructure/http/inbox.controller';

@Module({
  controllers: [InboxController],
  providers: [
    { provide: NOTIFICATION_PORT, useClass: ResendNotificationAdapter },
    {
      provide: IN_APP_NOTIFICATION_REPOSITORY_PORT,
      useClass: PrismaInAppNotificationRepository,
    },
    ResolutionNotificationListener,
    InAppNotificationListener,
    ListInboxNotificationsUseCase,
    MarkNotificationReadUseCase,
    MarkAllNotificationsReadUseCase,
  ],
  exports: [NOTIFICATION_PORT],
})
export class NotificationsModule {}
