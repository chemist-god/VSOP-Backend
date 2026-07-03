import { ApplicationError } from '@shared/domain/application-error.base';

export class UserNotFoundError extends ApplicationError {
  constructor(identifier: string) {
    super(`User not found: ${identifier}`, 'USER_NOT_FOUND', 404);
  }
}
