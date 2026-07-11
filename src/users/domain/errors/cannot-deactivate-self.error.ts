import { ApplicationError } from '@shared/domain/application-error.base';

export class CannotDeactivateSelfError extends ApplicationError {
  constructor() {
    super('You cannot remove your own account', 'CANNOT_DEACTIVATE_SELF', 400);
  }
}
