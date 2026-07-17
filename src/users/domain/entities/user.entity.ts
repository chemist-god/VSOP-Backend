import { AggregateRoot } from '@shared/domain/aggregate-root.base';
import { OnboardingStep, UserRole } from '@prisma/client';
import { EmailAddress } from '../value-objects/email-address.vo';

interface UserProps {
  name: string;
  email: EmailAddress;
  passwordHash: string;
  role: UserRole;
  isActive: boolean;
  resetToken?: string | null;
  resetTokenAt?: Date | null;
  tourCompleted: boolean;
  onboardingStep: OnboardingStep;
  acceptedTermsAt?: Date | null;
  termsVersion?: string | null;
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

  get tourCompleted(): boolean {
    return this.props.tourCompleted;
  }

  get onboardingStep(): OnboardingStep {
    return this.props.onboardingStep;
  }

  get acceptedTermsAt(): Date | null | undefined {
    return this.props.acceptedTermsAt;
  }

  get termsVersion(): string | null | undefined {
    return this.props.termsVersion;
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

  activate(): void {
    this.props.isActive = true;
    this.props.updatedAt = new Date();
  }

  setResetToken(token: string | null): void {
    this.props.resetToken = token;
    this.props.resetTokenAt = token ? new Date() : null;
    this.props.updatedAt = new Date();
  }

  setOnboardingStep(step: OnboardingStep): void {
    this.props.onboardingStep = step;
    if (step === OnboardingStep.AGREEMENT || step === OnboardingStep.COMPLETE) {
      this.props.tourCompleted = true;
    }
    this.props.updatedAt = new Date();
  }

  completeTour(): void {
    this.props.tourCompleted = true;
    this.props.updatedAt = new Date();
  }

  acceptTerms(version: string, at: Date): void {
    this.props.acceptedTermsAt = at;
    this.props.termsVersion = version;
    this.props.onboardingStep = OnboardingStep.COMPLETE;
    this.props.tourCompleted = true;
    this.props.updatedAt = new Date();
  }
}
