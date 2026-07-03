import { ApplicationError } from '@shared/domain/application-error.base';

export class DuplicateEmailError extends ApplicationError {
  constructor(email: string) {
    super(`A user with email "${email}" already exists`, 'DUPLICATE_EMAIL', 409);
  }
}
