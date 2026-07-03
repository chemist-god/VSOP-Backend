import { ValueObject } from '@shared/domain/value-object.base';
import { DomainError } from '@shared/domain/domain-error.base';

interface EmailAddressProps {
  value: string;
}

export class EmailAddress extends ValueObject<EmailAddressProps> {
  private constructor(props: EmailAddressProps) {
    super(props);
  }

  static create(raw: string): EmailAddress {
    const normalized = raw.trim().toLowerCase();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalized)) {
      throw new InvalidEmailError(raw);
    }
    return new EmailAddress({ value: normalized });
  }

  get value(): string {
    return this.props.value;
  }
}

export class InvalidEmailError extends DomainError {
  constructor(raw: string) {
    super(`"${raw}" is not a valid email address`, 'INVALID_EMAIL');
  }
}
