import { Injectable, Logger, Inject } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import { ConfigService } from '@nestjs/config';
import {
  NotificationStatus,
  NotificationType,
  TicketSource,
  UserRole,
} from '@prisma/client';
import { PrismaService } from '../../../prisma/prisma.service';
import {
  NOTIFICATION_PORT,
  NotificationPort,
} from '@notifications/application/ports/notification.port';
import { TicketCreatedEvent } from '@tickets/domain/events/ticket-created.event';

type Recipient = { id: string; name: string; email: string };

/**
 * Emails active ADMINs when a ticket is created.
 * - INTAKE: all active admins
 * - INTERNAL: all active admins + the creating admin (deduped)
 */
@Injectable()
export class TicketCreatedNotificationListener {
  private readonly logger = new Logger(TicketCreatedNotificationListener.name);

  constructor(
    @Inject(NOTIFICATION_PORT) private readonly notificationPort: NotificationPort,
    private readonly prisma: PrismaService,
    private readonly config: ConfigService,
  ) {}

  @OnEvent('ticket.created')
  async handleTicketCreated(event: TicketCreatedEvent): Promise<void> {
    try {
      const recipients = await this.resolveRecipients(event);
      if (recipients.length === 0) {
        this.logger.warn(
          `No admin recipients for ticket.created ${event.referenceId}`,
        );
        return;
      }

      const portalName = await this.resolvePortalName(event.portalId);
      const createdByName =
        event.source === TicketSource.INTERNAL
          ? await this.resolveCreatorName(event.createdById)
          : null;
      const frontendUrl =
        this.config.get<string>('appUrls.frontendUrl') ?? 'http://localhost:3000';
      const dashboardUrl = `${frontendUrl}/dashboard/tickets/${event.ticketId}`;

      await Promise.all(
        recipients.map((recipient) =>
          this.sendOne({
            recipient,
            event,
            portalName,
            createdByName,
            dashboardUrl,
          }),
        ),
      );
    } catch (err) {
      this.logger.error(
        `Failed to process ticket.created emails for ${event.referenceId}`,
        err,
      );
    }
  }

  private async resolveRecipients(event: TicketCreatedEvent): Promise<Recipient[]> {
    const admins = await this.prisma.user.findMany({
      where: { role: UserRole.ADMIN, isActive: true },
      select: { id: true, name: true, email: true },
    });

    const byEmail = new Map<string, Recipient>();
    for (const admin of admins) {
      const email = admin.email?.trim().toLowerCase();
      if (!email) continue;
      byEmail.set(email, {
        id: admin.id,
        name: admin.name,
        email: admin.email,
      });
    }

    // Internal tickets: always include the creator (even if not ADMIN — rare edge)
    if (event.source === TicketSource.INTERNAL && event.createdById) {
      const alreadyIncluded = [...byEmail.values()].some(
        (r) => r.id === event.createdById,
      );
      if (!alreadyIncluded) {
        const creator = await this.prisma.user.findFirst({
          where: { id: event.createdById, isActive: true },
          select: { id: true, name: true, email: true },
        });
        const email = creator?.email?.trim().toLowerCase();
        if (creator && email) {
          byEmail.set(email, {
            id: creator.id,
            name: creator.name,
            email: creator.email,
          });
        }
      }
    }

    return [...byEmail.values()];
  }

  private async resolvePortalName(portalId: string | null): Promise<string> {
    if (!portalId) return 'Internal';
    const portal = await this.prisma.portal.findUnique({
      where: { id: portalId },
      select: { companyName: true },
    });
    return portal?.companyName ?? 'Portal';
  }

  private async resolveCreatorName(createdById: string | null): Promise<string | null> {
    if (!createdById) return null;
    const user = await this.prisma.user.findUnique({
      where: { id: createdById },
      select: { name: true },
    });
    return user?.name ?? null;
  }

  private async sendOne(args: {
    recipient: Recipient;
    event: TicketCreatedEvent;
    portalName: string;
    createdByName: string | null;
    dashboardUrl: string;
  }): Promise<void> {
    const { recipient, event, portalName, createdByName, dashboardUrl } = args;

    try {
      await this.notificationPort.sendTicketCreatedNotification({
        recipientName: recipient.name,
        recipientEmail: recipient.email,
        ticketReferenceId: event.referenceId,
        portalName,
        issueDescription: event.description,
        source: event.source === TicketSource.INTERNAL ? 'INTERNAL' : 'INTAKE',
        dashboardUrl,
        createdByName,
      });

      await this.prisma.notificationLog.create({
        data: {
          ticketId: event.ticketId,
          recipientEmail: recipient.email,
          notificationType: NotificationType.TICKET_CREATED,
          status: NotificationStatus.SENT,
        },
      });
    } catch (err) {
      this.logger.error(
        `Failed ticket.created email to ${recipient.email} for ${event.referenceId}`,
        err,
      );
      await this.prisma.notificationLog.create({
        data: {
          ticketId: event.ticketId,
          recipientEmail: recipient.email,
          notificationType: NotificationType.TICKET_CREATED,
          status: NotificationStatus.FAILED,
          errorMessage: err instanceof Error ? err.message : 'Unknown error',
        },
      });
    }
  }
}
