import { DomainEvent } from '@shared/domain/domain-event.base';

export class TicketCreatedEvent extends DomainEvent {
  constructor(
    public readonly ticketId: string,
    public readonly portalId: string,
    public readonly referenceId: string,
  ) {
    super('ticket.created');
  }
}
