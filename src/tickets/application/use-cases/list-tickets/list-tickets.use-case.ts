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
      portalId: ticket.portalId,
      status: ticket.status,
      severity: ticket.severity,
      category: ticket.category,
      tags: ticket.tags,
      description: ticket.description,
      contactName: ticket.contactName,
      screenshotUrls: ticket.screenshotUrls,
      createdAt: ticket.createdAt,
      resolvedAt: ticket.resolvedAt,
    }));
  }

  async executeById(id: string) {
    const detail = await this.prismaTicketRepo.findDetailById(id);
    if (!detail) throw new TicketNotFoundError(id);

    const { ticket, notes, assignments } = detail;
    return {
      id: ticket.id,
      referenceId: ticket.referenceId,
      portalId: ticket.portalId,
      status: ticket.status,
      severity: ticket.severity,
      category: ticket.category,
      tags: ticket.tags,
      description: ticket.description,
      contactName: ticket.contactName,
      browserInfo: ticket.browserInfo,
      screenshotUrls: ticket.screenshotUrls,
      resolutionNote: ticket.resolutionNote,
      createdAt: ticket.createdAt,
      resolvedAt: ticket.resolvedAt,
      notes,
      assignments,
    };
  }
}
