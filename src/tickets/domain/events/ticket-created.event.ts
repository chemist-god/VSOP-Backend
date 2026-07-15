import { DomainEvent } from '@shared/domain/domain-event.base';
import { TicketSource } from '@prisma/client';

export class TicketCreatedEvent extends DomainEvent {
  constructor(
    public readonly ticketId: string,
    public readonly portalId: string | null,
    public readonly referenceId: string,
    public readonly source: TicketSource = TicketSource.INTAKE,
    public readonly description: string = '',
    public readonly createdById: string | null = null,
  ) {
    super('ticket.created');
  }
}
