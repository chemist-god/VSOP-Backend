import { DomainEvent } from '@shared/domain/domain-event.base';

export class TicketReadyForReviewEvent extends DomainEvent {
  constructor(
    public readonly ticketId: string,
    public readonly actorId: string,
    public readonly referenceId: string,
    public readonly description: string,
    public readonly reviewNote: string,
  ) {
    super('ticket.ready_for_review');
  }
}
