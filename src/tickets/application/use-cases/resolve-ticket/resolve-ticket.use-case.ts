import { Inject, Injectable } from '@nestjs/common';
import { TicketStatus } from '@prisma/client';
import { TICKET_REPOSITORY_PORT, TicketRepositoryPort } from '@tickets/application/ports/ticket-repository.port';
import { DOMAIN_EVENT_PUBLISHER_PORT, DomainEventPublisherPort } from '@shared/application/ports/domain-event-publisher.port';
import { PORTAL_REPOSITORY_PORT, PortalRepositoryPort } from '@portals/application/ports/portal-repository.port';
import { TicketNotFoundError } from '@tickets/domain/errors/ticket-not-found.error';
import { ResolveTicketCommand } from './resolve-ticket.command';

export type ResolveTicketResult = {
  id: string;
  status: TicketStatus;
  resolutionNote: string;
  resolvedAt: string | null;
  alreadyResolved: boolean;
};

@Injectable()
export class ResolveTicketUseCase {
  constructor(
    @Inject(TICKET_REPOSITORY_PORT) private readonly ticketRepo: TicketRepositoryPort,
    @Inject(PORTAL_REPOSITORY_PORT) private readonly portalRepo: PortalRepositoryPort,
    @Inject(DOMAIN_EVENT_PUBLISHER_PORT) private readonly eventPublisher: DomainEventPublisherPort,
  ) {}

  async execute(command: ResolveTicketCommand): Promise<ResolveTicketResult> {
    const ticket = await this.ticketRepo.findById(command.ticketId);
    if (!ticket) throw new TicketNotFoundError(command.ticketId);

    const portal = ticket.portalId
      ? await this.portalRepo.findById(ticket.portalId)
      : null;
    const clientEmail = portal?.clientAdminEmail ?? '';
    const portalName = portal?.companyName ?? 'Internal';

    const didResolve = ticket.resolve(
      command.resolutionNote,
      command.actorId,
      clientEmail,
      portalName,
    );
    await this.ticketRepo.save(ticket);

    if (didResolve) {
      this.eventPublisher.publishAll(ticket.domainEvents);
      ticket.clearDomainEvents();
    } else {
      ticket.clearDomainEvents();
    }

    return {
      id: ticket.id,
      status: ticket.status,
      resolutionNote: ticket.resolutionNote ?? command.resolutionNote.trim(),
      resolvedAt: ticket.resolvedAt?.toISOString() ?? null,
      alreadyResolved: !didResolve,
    };
  }
}
