import { AggregateRoot } from '@shared/domain/aggregate-root.base';
import { PortalStatus } from '@prisma/client';

interface PortalProps {
  slug: string;
  companyName: string;
  clientAdminEmail: string;
  description?: string | null;
  logoUrl?: string | null;
  status: PortalStatus;
  createdAt: Date;
  updatedAt: Date;
}

export class Portal extends AggregateRoot<PortalProps> {
  static create(props: PortalProps, id: string): Portal {
    return new Portal(props, id);
  }

  get slug(): string {
    return this.props.slug;
  }

  get companyName(): string {
    return this.props.companyName;
  }

  get clientAdminEmail(): string {
    return this.props.clientAdminEmail;
  }

  get description(): string | null | undefined {
    return this.props.description;
  }

  get logoUrl(): string | null | undefined {
    return this.props.logoUrl;
  }

  get status(): PortalStatus {
    return this.props.status;
  }

  activate(): void {
    this.props.status = PortalStatus.ACTIVE;
  }

  deactivate(): void {
    this.props.status = PortalStatus.INACTIVE;
  }

  updateProfile(input: {
    companyName: string;
    clientAdminEmail: string;
    description?: string | null;
    logoUrl?: string | null;
  }): void {
    this.props.companyName = input.companyName.trim();
    this.props.clientAdminEmail = input.clientAdminEmail.trim();
    this.props.description = input.description?.trim() || null;
    this.props.logoUrl = input.logoUrl?.trim() || null;
    this.props.updatedAt = new Date();
  }

  get isActive(): boolean {
    return this.props.status === PortalStatus.ACTIVE;
  }
}
