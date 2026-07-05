import { DomainEvent } from '@shared/domain/domain-event.base';

export class TicketResolvedEvent extends DomainEvent {
  constructor(
    public readonly ticketId: string,
    public readonly portalId: string,
    public readonly resolutionNote: string,
    public readonly clientAdminEmail: string,
    public readonly referenceId: string,
    public readonly originalDescription: string,
    public readonly portalName: string,
  ) {
    super('ticket.resolved');
  }
}
