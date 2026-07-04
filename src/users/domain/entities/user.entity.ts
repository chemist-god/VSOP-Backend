import { AggregateRoot } from '@shared/domain/aggregate-root.base';
import { UserRole } from '@prisma/client';
import { EmailAddress } from '../value-objects/email-address.vo';

interface UserProps {
  name: string;
  email: EmailAddress;
  passwordHash: string;
  role: UserRole;
  isActive: boolean;
  resetToken?: string | null;
  resetTokenAt?: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

export class User extends AggregateRoot<UserProps> {
  private constructor(props: UserProps, id: string) {
    super(props, id);
  }

  static create(props: UserProps, id: string): User {
    return new User(props, id);
  }

  get name(): string {
    return this.props.name;
  }

  get email(): EmailAddress {
    return this.props.email;
  }

  get passwordHash(): string {
    return this.props.passwordHash;
  }

  get role(): UserRole {
    return this.props.role;
  }

  get isActive(): boolean {
    return this.props.isActive;
  }

  get resetToken(): string | null | undefined {
    return this.props.resetToken;
  }

  get resetTokenAt(): Date | null | undefined {
    return this.props.resetTokenAt;
  }

  get createdAt(): Date {
    return this.props.createdAt;
  }

  updateName(name: string): void {
    this.props.name = name.trim();
    this.props.updatedAt = new Date();
  }

  updatePasswordHash(passwordHash: string): void {
    this.props.passwordHash = passwordHash;
    this.props.updatedAt = new Date();
  }

  deactivate(): void {
    this.props.isActive = false;
    this.props.updatedAt = new Date();
  }

  setResetToken(token: string | null): void {
    this.props.resetToken = token;
    this.props.resetTokenAt = token ? new Date() : null;
    this.props.updatedAt = new Date();
  }
}
