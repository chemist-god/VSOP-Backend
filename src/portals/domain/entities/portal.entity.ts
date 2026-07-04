import { AggregateRoot } from '@shared/domain/aggregate-root.base';
import { PortalStatus } from '@prisma/client';

interface PortalProps {
  slug: string;
  companyName: string;
  clientAdminEmail: string;
  description?: string | null;
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

  get status(): PortalStatus {
    return this.props.status;
  }

  activate(): void {
    this.props.status = PortalStatus.ACTIVE;
  }

  deactivate(): void {
    this.props.status = PortalStatus.INACTIVE;
  }

  get isActive(): boolean {
    return this.props.status === PortalStatus.ACTIVE;
  }
}
