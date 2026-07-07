import { Injectable, Logger } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import { PrismaService } from '../../../prisma/prisma.service';
import { DomainEvent } from '@shared/domain/domain-event.base';
import { TicketStatusChangedEvent } from '@tickets/domain/events/ticket-status-changed.event';
import { TicketCreatedEvent } from '@tickets/domain/events/ticket-created.event';
import { TicketResolvedEvent } from '@tickets/domain/events/ticket-resolved.event';

@Injectable()
export class AuditEventListener {
  private readonly logger = new Logger(AuditEventListener.name);

  constructor(private readonly prisma: PrismaService) {}

  @OnEvent('ticket.*')
  async handleTicketEvent(event: DomainEvent): Promise<void> {
    try {
      if (event instanceof TicketCreatedEvent) {
        await this.prisma.auditLog.create({
          data: {
            entityType: 'ticket',
            entityId: event.ticketId,
            ticketId: event.ticketId,
            action: 'ticket.created',
            actorType: 'SYSTEM',
            afterState: { portalId: event.portalId, referenceId: event.referenceId },
          },
        });
      }

      if (event instanceof TicketStatusChangedEvent) {
        await this.prisma.auditLog.create({
          data: {
            entityType: 'ticket',
            entityId: event.ticketId,
            ticketId: event.ticketId,
            action: 'ticket.status_changed',
            actorId: event.actorId,
            actorType: 'USER',
            beforeState: { status: event.from },
            afterState: { status: event.to },
          },
        });
      }

      if (event instanceof TicketResolvedEvent) {
        await this.prisma.auditLog.create({
          data: {
            entityType: 'ticket',
            entityId: event.ticketId,
            ticketId: event.ticketId,
            action: 'ticket.resolved',
            actorType: 'SYSTEM',
            afterState: {
              resolutionNote: event.resolutionNote,
              notifiedEmail: event.clientAdminEmail,
            },
          },
        });
      }
    } catch (err) {
      this.logger.error('Failed to write audit log', err);
    }
  }
}
