import { DomainError } from '@shared/domain/domain-error.base';

export class InvalidTicketTransitionError extends DomainError {
  constructor(from: string, to: string) {
    super(`Cannot transition ticket from "${from}" to "${to}"`, 'INVALID_TICKET_TRANSITION');
  }
}
