import { BadRequestException, Inject, Injectable } from '@nestjs/common';
import {
  TicketCategory,
  TicketSeverity,
  TicketSource,
  TicketStatus,
} from '@prisma/client';
import { TICKET_REPOSITORY_PORT, TicketRepositoryPort } from '@tickets/application/ports/ticket-repository.port';
import { PORTAL_REPOSITORY_PORT, PortalRepositoryPort } from '@portals/application/ports/portal-repository.port';
import { ID_GENERATOR_PORT, IdGeneratorPort } from '@shared/application/ports/id-generator.port';
import { CLOCK_PORT, ClockPort } from '@shared/application/ports/clock.port';
import {
  DOMAIN_EVENT_PUBLISHER_PORT,
  DomainEventPublisherPort,
} from '@shared/application/ports/domain-event-publisher.port';
import { Ticket } from '@tickets/domain/entities/ticket.entity';
import { AssignTicketUseCase } from '@assignments/application/use-cases/assign-ticket/assign-ticket.use-case';
import { CreateTicketCommand } from './create-ticket.command';

export interface CreateTicketResult {
  ticketId: string;
  referenceId: string;
  portalId: string | null;
  source: TicketSource;
  createdAt: string;
}

@Injectable()
export class CreateTicketUseCase {
  constructor(
    @Inject(TICKET_REPOSITORY_PORT) private readonly ticketRepo: TicketRepositoryPort,
    @Inject(PORTAL_REPOSITORY_PORT) private readonly portalRepo: PortalRepositoryPort,
    @Inject(ID_GENERATOR_PORT) private readonly idGen: IdGeneratorPort,
    @Inject(CLOCK_PORT) private readonly clock: ClockPort,
    @Inject(DOMAIN_EVENT_PUBLISHER_PORT)
    private readonly eventPublisher: DomainEventPublisherPort,
    private readonly assignTicket: AssignTicketUseCase,
  ) {}

  async execute(command: CreateTicketCommand): Promise<CreateTicketResult> {
    const description = command.description?.trim();
    if (!description) {
      throw new BadRequestException('Description is required');
    }

    if (command.portalId) {
      const portal = await this.portalRepo.findById(command.portalId);
      if (!portal) {
        throw new BadRequestException('Portal not found');
      }
    }

    if ((command.assigneeId && !command.dueDate) || (!command.assigneeId && command.dueDate)) {
      throw new BadRequestException('Assignee and due date must be provided together');
    }

    const now = this.clock.now();
    const id = this.idGen.generate();
    const dateStr = now.toISOString().slice(0, 10).replace(/-/g, '');
    const count = await this.ticketRepo.countInternalByDate(now);
    const referenceId = `VT-INT-${dateStr}-${String(count + 1).padStart(3, '0')}`;

    const ticket = Ticket.create(
      {
        portalId: command.portalId ?? null,
        source: TicketSource.INTERNAL,
        createdById: command.createdById,
        referenceId,
        status: TicketStatus.OPEN,
        severity: command.severity ?? TicketSeverity.UNSET,
        category: command.category ?? TicketCategory.OTHER,
        tags: [],
        description,
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

    if (command.assigneeId && command.dueDate) {
      await this.assignTicket.execute({
        ticketId: id,
        assigneeId: command.assigneeId,
        assignedBy: command.createdById,
        dueDate: command.dueDate,
      });
    }

    return {
      ticketId: id,
      referenceId,
      portalId: command.portalId ?? null,
      source: TicketSource.INTERNAL,
      createdAt: now.toISOString(),
    };
  }
}
