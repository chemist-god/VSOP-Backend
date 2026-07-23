import { ApplicationError } from '@shared/domain/application-error.base';

export class ForbiddenTicketActionError extends ApplicationError {
  constructor(message: string) {
    super(message, 'FORBIDDEN_TICKET_ACTION', 403);
  }
}
