import { Inject, Injectable } from '@nestjs/common';
import { TicketStatus, UserRole } from '@prisma/client';
import { TICKET_REPOSITORY_PORT, TicketRepositoryPort } from '@tickets/application/ports/ticket-repository.port';
import { DOMAIN_EVENT_PUBLISHER_PORT, DomainEventPublisherPort } from '@shared/application/ports/domain-event-publisher.port';
import { TicketNotFoundError } from '@tickets/domain/errors/ticket-not-found.error';
import { ForbiddenTicketActionError } from '@tickets/domain/errors/forbidden-ticket-action.error';

/** Statuses developers may set via generic status change (not resolve). */
const DEVELOPER_ALLOWED_STATUSES: TicketStatus[] = [
  TicketStatus.OPEN,
  TicketStatus.IN_PROGRESS,
  TicketStatus.PENDING_REVIEW,
];

@Injectable()
export class ChangeTicketStatusUseCase {
  constructor(
    @Inject(TICKET_REPOSITORY_PORT) private readonly ticketRepo: TicketRepositoryPort,
    @Inject(DOMAIN_EVENT_PUBLISHER_PORT) private readonly eventPublisher: DomainEventPublisherPort,
  ) {}

  async execute(
    ticketId: string,
    status: TicketStatus,
    actorId: string,
    actorRole: UserRole,
  ) {
    // Client email + resolution note require the dedicated resolve endpoint.
    if (status === TicketStatus.RESOLVED) {
      throw new ForbiddenTicketActionError(
        'Use "Mark resolved & email client" to resolve a ticket with a resolution note',
      );
    }

    if (actorRole !== UserRole.ADMIN) {
      if (!DEVELOPER_ALLOWED_STATUSES.includes(status)) {
        throw new ForbiddenTicketActionError(
          'Developers cannot close tickets — submit for review and wait for admin approval',
        );
      }
    }

    const ticket = await this.ticketRepo.findById(ticketId);
    if (!ticket) throw new TicketNotFoundError(ticketId);

    ticket.changeStatus(status, actorId);
    await this.ticketRepo.save(ticket);
    this.eventPublisher.publishAll(ticket.domainEvents);
    ticket.clearDomainEvents();

    return { id: ticket.id, status: ticket.status };
  }
}
