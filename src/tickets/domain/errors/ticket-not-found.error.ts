import { ApplicationError } from '@shared/domain/application-error.base';

export class TicketNotFoundError extends ApplicationError {
  constructor(id: string) {
    super(`Ticket not found: ${id}`, 'TICKET_NOT_FOUND', 404);
  }
}
