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
      if (event.source !== TicketSource.INTAKE) return;

      const admins = await this.prisma.user.findMany({
        where: { role: UserRole.ADMIN, isActive: true },
        select: { id: true },
      });

      const snippet = truncate(event.description, 120);
      await this.repo.createMany(
        admins.map((admin) => ({
          id: this.idGen.generate(),
          userId: admin.id,
          type: 'TICKET_CREATED' as const,
          title: `New ticket ${event.referenceId}`,
          body: snippet || 'A new portal support ticket needs triage.',
          ticketId: event.ticketId,
        })),
      );
    } catch (err) {
      this.logger.error('Failed to create inbox items for ticket.created', err);
    }
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
