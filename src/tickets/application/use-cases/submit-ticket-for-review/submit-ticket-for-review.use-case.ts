import { Inject, Injectable } from '@nestjs/common';
import { TicketStatus, UserRole } from '@prisma/client';
import { TICKET_REPOSITORY_PORT, TicketRepositoryPort } from '@tickets/application/ports/ticket-repository.port';
import { DOMAIN_EVENT_PUBLISHER_PORT, DomainEventPublisherPort } from '@shared/application/ports/domain-event-publisher.port';
import { ID_GENERATOR_PORT, IdGeneratorPort } from '@shared/application/ports/id-generator.port';
import { PrismaService } from '../../../../prisma/prisma.service';
import { TicketNotFoundError } from '@tickets/domain/errors/ticket-not-found.error';
import { ForbiddenTicketActionError } from '@tickets/domain/errors/forbidden-ticket-action.error';
import { InvalidTicketInputError } from '@tickets/domain/errors/invalid-ticket-input.error';
import { SubmitTicketForReviewCommand } from './submit-ticket-for-review.command';

const SUBMITTABLE: TicketStatus[] = [
  TicketStatus.OPEN,
  TicketStatus.IN_PROGRESS,
  TicketStatus.PENDING_REVIEW,
];

export type SubmitTicketForReviewResult = {
  id: string;
  status: TicketStatus;
  noteId: string;
};

@Injectable()
export class SubmitTicketForReviewUseCase {
  constructor(
    @Inject(TICKET_REPOSITORY_PORT) private readonly ticketRepo: TicketRepositoryPort,
    @Inject(DOMAIN_EVENT_PUBLISHER_PORT) private readonly eventPublisher: DomainEventPublisherPort,
    @Inject(ID_GENERATOR_PORT) private readonly idGen: IdGeneratorPort,
    private readonly prisma: PrismaService,
  ) {}

  async execute(command: SubmitTicketForReviewCommand): Promise<SubmitTicketForReviewResult> {
    const note = command.reviewNote?.trim();
    if (!note || note.length < 10) {
      throw new InvalidTicketInputError(
        'A review note of at least 10 characters is required',
      );
    }

    const ticket = await this.ticketRepo.findById(command.ticketId);
    if (!ticket) throw new TicketNotFoundError(command.ticketId);

    if (
      ticket.status === TicketStatus.RESOLVED ||
      ticket.status === TicketStatus.CLOSED
    ) {
      throw new ForbiddenTicketActionError(
        'Resolved or closed tickets cannot be submitted for review',
      );
    }

    if (!SUBMITTABLE.includes(ticket.status)) {
      throw new ForbiddenTicketActionError(
        `Cannot submit ticket for review from status "${ticket.status}"`,
      );
    }

    const activeAssignment = await this.prisma.assignment.findFirst({
      where: { ticketId: ticket.id, isActive: true },
      select: { assigneeId: true },
    });

    if (command.actorRole === UserRole.ADMIN) {
      throw new ForbiddenTicketActionError(
        'Admins resolve tickets directly — submit for review is for the assigned developer',
      );
    }

    if (!activeAssignment || activeAssignment.assigneeId !== command.actorId) {
      throw new ForbiddenTicketActionError(
        'Only the assigned developer can submit a ticket for review',
      );
    }

    ticket.submitForReview(note, command.actorId);
    await this.ticketRepo.save(ticket);

    const noteId = this.idGen.generate();
    await this.prisma.ticketNote.create({
      data: {
        id: noteId,
        ticketId: ticket.id,
        authorId: command.actorId,
        content: note,
        isInternal: true,
      },
    });

    this.eventPublisher.publishAll(ticket.domainEvents);
    ticket.clearDomainEvents();

    return {
      id: ticket.id,
      status: ticket.status,
      noteId,
    };
  }
}
