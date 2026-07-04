import { DomainError } from '@shared/domain/domain-error.base';

export class PortalInactiveError extends DomainError {
  constructor(slug: string) {
    super(`Portal "${slug}" is inactive and cannot accept submissions`, 'PORTAL_INACTIVE');
  }
}
