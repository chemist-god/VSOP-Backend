import { ApplicationError } from '@shared/domain/application-error.base';

export class PortalNotFoundError extends ApplicationError {
  constructor(identifier: string) {
    super(`Portal not found: ${identifier}`, 'PORTAL_NOT_FOUND', 404);
  }
}
