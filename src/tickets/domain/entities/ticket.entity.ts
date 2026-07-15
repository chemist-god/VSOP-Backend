import { AggregateRoot } from '@shared/domain/aggregate-root.base';
import {
  TicketCategory,
  TicketSeverity,
  TicketSource,
  TicketStatus,
} from '@prisma/client';
import { InvalidTicketTransitionError } from '../errors/invalid-ticket-transition.error';
import { TicketStatusChangedEvent } from '../events/ticket-status-changed.event';
import { TicketResolvedEvent } from '../events/ticket-resolved.event';
import { TicketCreatedEvent } from '../events/ticket-created.event';

/** Board-friendly transitions — Kanban can move cards between columns freely. */
const ALLOWED_TRANSITIONS: Record<TicketStatus, TicketStatus[]> = {
  [TicketStatus.OPEN]: [TicketStatus.IN_PROGRESS, TicketStatus.RESOLVED, TicketStatus.CLOSED],
  [TicketStatus.IN_PROGRESS]: [TicketStatus.OPEN, TicketStatus.RESOLVED, TicketStatus.CLOSED],
  [TicketStatus.RESOLVED]: [TicketStatus.OPEN, TicketStatus.IN_PROGRESS, TicketStatus.CLOSED],
  [TicketStatus.CLOSED]: [TicketStatus.OPEN, TicketStatus.IN_PROGRESS, TicketStatus.RESOLVED],
};

interface TicketProps {
  portalId?: string | null;
  source: TicketSource;
  createdById?: string | null;
  referenceId: string;
  status: TicketStatus;
  severity: TicketSeverity;
  category: TicketCategory;
  tags: string[];
  description: string;
  contactName?: string | null;
  browserInfo?: Record<string, unknown> | null;
  screenshotUrls: string[];
  resolutionNote?: string | null;
  resolvedAt?: Date | null;
  closedAt?: Date | null;
  createdAt: Date;
  updatedAt: Date;
  clientAdminEmail?: string;
  portalName?: string;
}

export class Ticket extends AggregateRoot<TicketProps> {
  static create(props: TicketProps, id: string): Ticket {
    return new Ticket(props, id);
  }

  get portalId(): string | null | undefined {
    return this.props.portalId;
  }

  get source(): TicketSource {
    return this.props.source;
  }

  get createdById(): string | null | undefined {
    return this.props.createdById;
  }

  get referenceId(): string {
    return this.props.referenceId;
  }

  get status(): TicketStatus {
    return this.props.status;
  }

  get severity(): TicketSeverity {
    return this.props.severity;
  }

  get category(): TicketCategory {
    return this.props.category;
  }

  get tags(): string[] {
    return this.props.tags;
  }

  get description(): string {
    return this.props.description;
  }

  get contactName(): string | null | undefined {
    return this.props.contactName;
  }

  get browserInfo(): Record<string, unknown> | null | undefined {
    return this.props.browserInfo;
  }

  get screenshotUrls(): string[] {
    return this.props.screenshotUrls;
  }

  get resolutionNote(): string | null | undefined {
    return this.props.resolutionNote;
  }

  get resolvedAt(): Date | null | undefined {
    return this.props.resolvedAt;
  }

  get closedAt(): Date | null | undefined {
    return this.props.closedAt;
  }

  get createdAt(): Date {
    return this.props.createdAt;
  }

  changeStatus(newStatus: TicketStatus, actorId: string): void {
    const allowed = ALLOWED_TRANSITIONS[this.props.status];
    if (!allowed.includes(newStatus)) {
      throw new InvalidTicketTransitionError(this.props.status, newStatus);
    }

    const prev = this.props.status;
    this.props.status = newStatus;
    this.props.updatedAt = new Date();

    if (newStatus === TicketStatus.RESOLVED) {
      this.props.resolvedAt = new Date();
    }
    if (newStatus === TicketStatus.CLOSED) {
      this.props.closedAt = new Date();
    }

    this.addDomainEvent(new TicketStatusChangedEvent(this.id, actorId, prev, newStatus));
  }

  resolve(
    resolutionNote: string,
    actorId: string,
    clientAdminEmail: string,
    portalName: string,
  ): void {
    if (!resolutionNote?.trim()) {
      throw new Error('Resolution note is required before marking a ticket as resolved');
    }
    this.props.resolutionNote = resolutionNote;
    this.props.clientAdminEmail = clientAdminEmail;
    this.props.portalName = portalName;
    this.changeStatus(TicketStatus.RESOLVED, actorId);

    this.addDomainEvent(
      new TicketResolvedEvent(
        this.id,
        this.props.portalId ?? null,
        resolutionNote,
        clientAdminEmail,
        this.props.referenceId,
        this.props.description,
        portalName,
      ),
    );
  }

  setSeverity(severity: TicketSeverity): void {
    this.props.severity = severity;
    this.props.updatedAt = new Date();
  }

  addScreenshots(urls: string[]): void {
    this.props.screenshotUrls = [...this.props.screenshotUrls, ...urls];
  }

  recordCreated(): void {
    this.addDomainEvent(
      new TicketCreatedEvent(
        this.id,
        this.props.portalId ?? null,
        this.props.referenceId,
        this.props.source,
        this.props.description,
        this.props.createdById ?? null,
      ),
    );
  }
}
