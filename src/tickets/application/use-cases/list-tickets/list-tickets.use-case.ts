import { Inject, Injectable } from '@nestjs/common';
import { TICKET_REPOSITORY_PORT, TicketFilters, TicketRepositoryPort } from '@tickets/application/ports/ticket-repository.port';
import { PrismaTicketRepository } from '@tickets/infrastructure/persistence/prisma-ticket.repository';
import { TicketNotFoundError } from '@tickets/domain/errors/ticket-not-found.error';

@Injectable()
export class ListTicketsUseCase {
  constructor(
    @Inject(TICKET_REPOSITORY_PORT) private readonly ticketRepo: TicketRepositoryPort,
    private readonly prismaTicketRepo: PrismaTicketRepository,
  ) {}

  async execute(filters?: TicketFilters) {
    const tickets = await this.ticketRepo.findAll(filters);
    return tickets.map((ticket) => ({
      id: ticket.id,
      referenceId: ticket.referenceId,
      portalId: ticket.portalId ?? null,
      source: ticket.source,
      createdById: ticket.createdById ?? null,
      status: ticket.status,
      severity: ticket.severity,
      category: ticket.category,
      tags: ticket.tags,
      description: ticket.description,
      contactName: ticket.contactName ?? null,
      screenshotUrls: ticket.screenshotUrls,
      createdAt: ticket.createdAt,
      resolvedAt: ticket.resolvedAt ?? null,
    }));
  }

  async executeById(id: string) {
    const detail = await this.prismaTicketRepo.findDetailById(id);
    if (!detail) throw new TicketNotFoundError(id);

    const { ticket, notes, assignments } = detail;
    return {
      id: ticket.id,
      referenceId: ticket.referenceId,
      portalId: ticket.portalId ?? null,
      source: ticket.source,
      createdById: ticket.createdById ?? null,
      status: ticket.status,
      severity: ticket.severity,
      category: ticket.category,
      tags: ticket.tags,
      description: ticket.description,
      contactName: ticket.contactName ?? null,
      browserInfo: ticket.browserInfo ?? null,
      screenshotUrls: ticket.screenshotUrls,
      resolutionNote: ticket.resolutionNote ?? null,
      createdAt: ticket.createdAt,
      resolvedAt: ticket.resolvedAt ?? null,
      notes,
      assignments,
    };
  }
}
