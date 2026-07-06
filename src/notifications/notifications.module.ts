import { Module } from '@nestjs/common';
import { NOTIFICATION_PORT } from './application/ports/notification.port';
import { ResendNotificationAdapter } from './infrastructure/resend-notification.adapter';
import { ResolutionNotificationListener } from './application/listeners/resolution-notification.listener';

@Module({
  providers: [
    { provide: NOTIFICATION_PORT, useClass: ResendNotificationAdapter },
    ResolutionNotificationListener,
  ],
  exports: [NOTIFICATION_PORT],
})
export class NotificationsModule {}
