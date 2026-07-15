import { DomainEvent } from '@shared/domain/domain-event.base';

export class TicketAssignedEvent extends DomainEvent {
  constructor(
    public readonly ticketId: string,
    public readonly assignmentId: string,
    public readonly assigneeId: string,
    public readonly assignedBy: string,
    public readonly referenceId: string,
    public readonly description: string,
    public readonly dueDate: Date,
  ) {
    super('ticket.assigned');
  }
}
