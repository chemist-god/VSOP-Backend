import { ApplicationError } from '@shared/domain/application-error.base';

export class InvalidTicketInputError extends ApplicationError {
  constructor(message: string) {
    super(message, 'INVALID_TICKET_INPUT', 400);
  }
}
