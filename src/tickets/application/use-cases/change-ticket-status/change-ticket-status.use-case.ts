import { Inject, Injectable } from '@nestjs/common';
import { TicketStatus } from '@prisma/client';
import { TICKET_REPOSITORY_PORT, TicketRepositoryPort } from '@tickets/application/ports/ticket-repository.port';
import { DOMAIN_EVENT_PUBLISHER_PORT, DomainEventPublisherPort } from '@shared/application/ports/domain-event-publisher.port';
import { TicketNotFoundError } from '@tickets/domain/errors/ticket-not-found.error';

@Injectable()
export class ChangeTicketStatusUseCase {
  constructor(
    @Inject(TICKET_REPOSITORY_PORT) private readonly ticketRepo: TicketRepositoryPort,
    @Inject(DOMAIN_EVENT_PUBLISHER_PORT) private readonly eventPublisher: DomainEventPublisherPort,
  ) {}

  async execute(ticketId: string, status: TicketStatus, actorId: string) {
    const ticket = await this.ticketRepo.findById(ticketId);
    if (!ticket) throw new TicketNotFoundError(ticketId);

    ticket.changeStatus(status, actorId);
    await this.ticketRepo.save(ticket);
    this.eventPublisher.publishAll(ticket.domainEvents);
    ticket.clearDomainEvents();

    return { id: ticket.id, status: ticket.status };
  }
}
