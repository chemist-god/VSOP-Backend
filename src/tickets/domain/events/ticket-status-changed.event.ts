import { DomainEvent } from '@shared/domain/domain-event.base';
import { TicketStatus } from '@prisma/client';

export class TicketStatusChangedEvent extends DomainEvent {
  constructor(
    public readonly ticketId: string,
    public readonly actorId: string,
    public readonly from: TicketStatus,
    public readonly to: TicketStatus,
  ) {
    super('ticket.status_changed');
  }
}
