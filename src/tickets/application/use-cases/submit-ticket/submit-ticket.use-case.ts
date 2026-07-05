import { Inject, Injectable } from '@nestjs/common';
import { TicketCategory, TicketSeverity, TicketStatus } from '@prisma/client';
import { TICKET_REPOSITORY_PORT, TicketRepositoryPort } from '@tickets/application/ports/ticket-repository.port';
import { ID_GENERATOR_PORT, IdGeneratorPort } from '@shared/application/ports/id-generator.port';
import { CLOCK_PORT, ClockPort } from '@shared/application/ports/clock.port';
import { DOMAIN_EVENT_PUBLISHER_PORT, DomainEventPublisherPort } from '@shared/application/ports/domain-event-publisher.port';
import { Ticket } from '@tickets/domain/entities/ticket.entity';
import { TicketCreatedEvent } from '@tickets/domain/events/ticket-created.event';
import { SubmitTicketCommand } from './submit-ticket.command';

export interface SubmitTicketResult {
  ticketId: string;
  referenceId: string;
  portalId: string;
  portalSlug: string;
  submittedAt: string;
}

@Injectable()
export class SubmitTicketUseCase {
  constructor(
    @Inject(TICKET_REPOSITORY_PORT) private readonly ticketRepo: TicketRepositoryPort,
    @Inject(ID_GENERATOR_PORT) private readonly idGen: IdGeneratorPort,
    @Inject(CLOCK_PORT) private readonly clock: ClockPort,
    @Inject(DOMAIN_EVENT_PUBLISHER_PORT) private readonly eventPublisher: DomainEventPublisherPort,
  ) {}

  async execute(command: SubmitTicketCommand): Promise<SubmitTicketResult> {
    const now = this.clock.now();
    const id = this.idGen.generate();

    const dateStr = now.toISOString().slice(0, 10).replace(/-/g, '');
    const prefix = command.portalSlug.substring(0, 3).toUpperCase();
    const count = await this.ticketRepo.countByPortalAndDate(command.portalId, now);
    const referenceId = `VT-${prefix}-${dateStr}-${String(count + 1).padStart(3, '0')}`;

    const ticket = Ticket.create(
      {
        portalId: command.portalId,
        referenceId,
        status: TicketStatus.OPEN,
        severity: TicketSeverity.UNSET,
        category: command.category ?? TicketCategory.UNSET,
        tags: command.tags ?? [],
        description: command.description,
        contactName: command.contactName,
        browserInfo: command.browserInfo,
        screenshotUrls: command.screenshotUrls ?? [],
        createdAt: now,
        updatedAt: now,
      },
      id,
    );

    ticket.recordCreated();
    await this.ticketRepo.save(ticket);
    this.eventPublisher.publishAll(ticket.domainEvents);
    ticket.clearDomainEvents();

    return {
      ticketId: id,
      referenceId,
      portalId: command.portalId,
      portalSlug: command.portalSlug,
      submittedAt: now.toISOString(),
    };
  }
}
