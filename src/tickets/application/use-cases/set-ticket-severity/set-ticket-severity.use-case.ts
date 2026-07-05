import { Inject, Injectable } from '@nestjs/common';
import { TicketSeverity } from '@prisma/client';
import { TICKET_REPOSITORY_PORT, TicketRepositoryPort } from '@tickets/application/ports/ticket-repository.port';
import { TicketNotFoundError } from '@tickets/domain/errors/ticket-not-found.error';

@Injectable()
export class SetTicketSeverityUseCase {
  constructor(@Inject(TICKET_REPOSITORY_PORT) private readonly ticketRepo: TicketRepositoryPort) {}

  async execute(ticketId: string, severity: TicketSeverity) {
    const ticket = await this.ticketRepo.findById(ticketId);
    if (!ticket) throw new TicketNotFoundError(ticketId);

    ticket.setSeverity(severity);
    await this.ticketRepo.save(ticket);
    return { id: ticket.id, severity: ticket.severity };
  }
}
