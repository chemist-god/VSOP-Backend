import { Injectable, Logger, Inject } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import { TicketSource, UserRole } from '@prisma/client';
import { PrismaService } from '../../../prisma/prisma.service';
import {
  IN_APP_NOTIFICATION_REPOSITORY_PORT,
  InAppNotificationRepositoryPort,
} from '@notifications/application/ports/in-app-notification-repository.port';
import { ID_GENERATOR_PORT, IdGeneratorPort } from '@shared/application/ports/id-generator.port';
import { TicketCreatedEvent } from '@tickets/domain/events/ticket-created.event';
import { TicketAssignedEvent } from '@tickets/domain/events/ticket-assigned.event';
import { TicketResolvedEvent } from '@tickets/domain/events/ticket-resolved.event';
import { TicketReadyForReviewEvent } from '@tickets/domain/events/ticket-ready-for-review.event';

@Injectable()
export class InAppNotificationListener {
  private readonly logger = new Logger(InAppNotificationListener.name);

  constructor(
    @Inject(IN_APP_NOTIFICATION_REPOSITORY_PORT)
    private readonly repo: InAppNotificationRepositoryPort,
    @Inject(ID_GENERATOR_PORT) private readonly idGen: IdGeneratorPort,
    private readonly prisma: PrismaService,
  ) {}

  @OnEvent('ticket.created')
  async handleTicketCreated(event: TicketCreatedEvent): Promise<void> {
    try {
      const recipientIds = await this.resolveCreatedRecipientIds(event);
      if (recipientIds.length === 0) return;

      const snippet = truncate(event.description, 120);
      const isIntake = event.source === TicketSource.INTAKE;

      await this.repo.createMany(
        recipientIds.map((userId) => ({
          id: this.idGen.generate(),
          userId,
          type: 'TICKET_CREATED' as const,
          title: isIntake
            ? `New ticket ${event.referenceId}`
            : `Internal ticket ${event.referenceId}`,
          body:
            snippet ||
            (isIntake
              ? 'A new portal support ticket needs triage.'
              : 'An internal ticket was filed.'),
          ticketId: event.ticketId,
        })),
      );
    } catch (err) {
      this.logger.error('Failed to create inbox items for ticket.created', err);
    }
  }

  /** Active admins always; internal tickets also include the creator. */
  private async resolveCreatedRecipientIds(
    event: TicketCreatedEvent,
  ): Promise<string[]> {
    const admins = await this.prisma.user.findMany({
      where: { role: UserRole.ADMIN, isActive: true },
      select: { id: true },
    });
    const ids = new Set(admins.map((a) => a.id));

    if (event.source === TicketSource.INTERNAL && event.createdById) {
      ids.add(event.createdById);
    }

    return [...ids];
  }

  private async resolveAdminIds(): Promise<string[]> {
    const admins = await this.prisma.user.findMany({
      where: { role: UserRole.ADMIN, isActive: true },
      select: { id: true },
    });
    return admins.map((a) => a.id);
  }

  @OnEvent('ticket.assigned')
  async handleTicketAssigned(event: TicketAssignedEvent): Promise<void> {
    try {
      if (event.assigneeId === event.assignedBy) return;

      const snippet = truncate(event.description, 120);
      await this.repo.createMany([
        {
          id: this.idGen.generate(),
          userId: event.assigneeId,
          type: 'TICKET_ASSIGNED',
          title: `Assigned ${event.referenceId}`,
          body: snippet || 'You have been assigned a new ticket.',
          ticketId: event.ticketId,
        },
      ]);
    } catch (err) {
      this.logger.error('Failed to create inbox item for ticket.assigned', err);
    }
  }

  @OnEvent('ticket.ready_for_review')
  async handleTicketReadyForReview(event: TicketReadyForReviewEvent): Promise<void> {
    try {
      const adminIds = await this.resolveAdminIds();
      const recipients = adminIds.filter((id) => id !== event.actorId);
      if (recipients.length === 0) return;

      const snippet = truncate(event.reviewNote, 120);
      await this.repo.createMany(
        recipients.map((userId) => ({
          id: this.idGen.generate(),
          userId,
          type: 'TICKET_READY_FOR_REVIEW' as const,
          title: `Review ${event.referenceId}`,
          body: snippet || 'A ticket is ready for admin review.',
          ticketId: event.ticketId,
        })),
      );
    } catch (err) {
      this.logger.error('Failed to create inbox items for ticket.ready_for_review', err);
    }
  }

  @OnEvent('ticket.resolved')
  async handleTicketResolved(event: TicketResolvedEvent): Promise<void> {
    try {
      const active = await this.prisma.assignment.findFirst({
        where: { ticketId: event.ticketId, isActive: true },
        select: { assigneeId: true },
      });
      if (!active) return;

      await this.repo.createMany([
        {
          id: this.idGen.generate(),
          userId: active.assigneeId,
          type: 'TICKET_RESOLVED',
          title: `Resolved ${event.referenceId}`,
          body: truncate(event.resolutionNote, 120) || 'Ticket marked resolved.',
          ticketId: event.ticketId,
        },
      ]);
    } catch (err) {
      this.logger.error('Failed to create inbox item for ticket.resolved', err);
    }
  }
}

function truncate(value: string, max: number): string {
  const trimmed = value?.trim() ?? '';
  if (trimmed.length <= max) return trimmed;
  return `${trimmed.slice(0, max - 1)}…`;
}
