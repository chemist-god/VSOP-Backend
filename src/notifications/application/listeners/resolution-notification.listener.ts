import { Injectable, Logger } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import { NotificationStatus, NotificationType } from '@prisma/client';
import { PrismaService } from '../../../prisma/prisma.service';
import { NOTIFICATION_PORT, NotificationPort } from '@notifications/application/ports/notification.port';
import { Inject } from '@nestjs/common';
import { TicketResolvedEvent } from '@tickets/domain/events/ticket-resolved.event';

@Injectable()
export class ResolutionNotificationListener {
  private readonly logger = new Logger(ResolutionNotificationListener.name);

  constructor(
    @Inject(NOTIFICATION_PORT) private readonly notificationPort: NotificationPort,
    private readonly prisma: PrismaService,
  ) {}

  @OnEvent('ticket.resolved')
  async handleTicketResolved(event: TicketResolvedEvent): Promise<void> {
    try {
      await this.notificationPort.sendResolutionNotification({
        clientAdminEmail: event.clientAdminEmail,
        portalName: event.portalName,
        ticketReferenceId: event.referenceId,
        originalDescription: event.originalDescription,
        resolutionNote: event.resolutionNote,
        resolvedAt: event.occurredAt,
      });

      await this.prisma.notificationLog.create({
        data: {
          ticketId: event.ticketId,
          recipientEmail: event.clientAdminEmail,
          notificationType: NotificationType.RESOLUTION,
          status: NotificationStatus.SENT,
        },
      });
    } catch (err) {
      this.logger.error('Failed to process resolution notification', err);
      await this.prisma.notificationLog.create({
        data: {
          ticketId: event.ticketId,
          recipientEmail: event.clientAdminEmail,
          notificationType: NotificationType.RESOLUTION,
          status: NotificationStatus.FAILED,
          errorMessage: err instanceof Error ? err.message : 'Unknown error',
        },
      });
    }
  }
}
