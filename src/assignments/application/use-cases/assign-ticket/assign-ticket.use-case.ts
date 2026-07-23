import { Inject, Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { TicketStatus } from '@prisma/client';
import { ASSIGNMENT_REPOSITORY_PORT, AssignmentRepositoryPort } from '@assignments/application/ports/assignment-repository.port';
import { TICKET_REPOSITORY_PORT, TicketRepositoryPort } from '@tickets/application/ports/ticket-repository.port';
import { USER_REPOSITORY_PORT, UserRepositoryPort } from '@users/application/ports/user-repository.port';
import { PORTAL_REPOSITORY_PORT, PortalRepositoryPort } from '@portals/application/ports/portal-repository.port';
import { NOTIFICATION_PORT, NotificationPort } from '@notifications/application/ports/notification.port';
import { DOMAIN_EVENT_PUBLISHER_PORT, DomainEventPublisherPort } from '@shared/application/ports/domain-event-publisher.port';
import { ID_GENERATOR_PORT, IdGeneratorPort } from '@shared/application/ports/id-generator.port';
import { TicketNotFoundError } from '@tickets/domain/errors/ticket-not-found.error';
import { UserNotFoundError } from '@users/domain/errors/user-not-found.error';
import { TicketAssignedEvent } from '@tickets/domain/events/ticket-assigned.event';
import { AssignTicketInput } from './assign-ticket.command';

@Injectable()
export class AssignTicketUseCase {
  constructor(
    @Inject(ASSIGNMENT_REPOSITORY_PORT) private readonly assignmentRepo: AssignmentRepositoryPort,
    @Inject(TICKET_REPOSITORY_PORT) private readonly ticketRepo: TicketRepositoryPort,
    @Inject(USER_REPOSITORY_PORT) private readonly userRepo: UserRepositoryPort,
    @Inject(PORTAL_REPOSITORY_PORT) private readonly portalRepo: PortalRepositoryPort,
    @Inject(NOTIFICATION_PORT) private readonly notificationPort: NotificationPort,
    @Inject(DOMAIN_EVENT_PUBLISHER_PORT) private readonly eventPublisher: DomainEventPublisherPort,
    @Inject(ID_GENERATOR_PORT) private readonly idGen: IdGeneratorPort,
    private readonly config: ConfigService,
  ) {}

  async execute(input: AssignTicketInput) {
    const ticket = await this.ticketRepo.findById(input.ticketId);
    if (!ticket) throw new TicketNotFoundError(input.ticketId);

    const assignee = await this.userRepo.findById(input.assigneeId);
    if (!assignee) throw new UserNotFoundError(input.assigneeId);

    await this.assignmentRepo.deactivateActiveByTicketId(input.ticketId);

    const assignmentId = this.idGen.generate();
    await this.assignmentRepo.save({
      id: assignmentId,
      ticketId: input.ticketId,
      assigneeId: input.assigneeId,
      assignedBy: input.assignedBy,
      dueDate: input.dueDate,
      isActive: true,
    });

    if (
      ticket.status === TicketStatus.OPEN ||
      ticket.status === TicketStatus.PENDING_REVIEW
    ) {
      ticket.changeStatus(TicketStatus.IN_PROGRESS, input.assignedBy);
      await this.ticketRepo.save(ticket);
      this.eventPublisher.publishAll(ticket.domainEvents);
      ticket.clearDomainEvents();
    }

    this.eventPublisher.publishAll([
      new TicketAssignedEvent(
        ticket.id,
        assignmentId,
        input.assigneeId,
        input.assignedBy,
        ticket.referenceId,
        ticket.description,
        input.dueDate,
      ),
    ]);

    const portal = ticket.portalId
      ? await this.portalRepo.findById(ticket.portalId)
      : null;
    const frontendUrl =
      this.config.get<string>('appUrls.frontendUrl') ?? 'http://localhost:3000';

    await this.notificationPort.sendAssignmentNotification({
      assigneeName: assignee.name,
      assigneeEmail: assignee.email.value,
      ticketReferenceId: ticket.referenceId,
      portalName: portal?.companyName ?? 'Internal',
      issueDescription: ticket.description,
      dueDate: input.dueDate,
      dashboardUrl: `${frontendUrl}/dashboard/tickets/${ticket.id}`,
    });

    return {
      assignmentId,
      ticketId: input.ticketId,
      assigneeId: input.assigneeId,
      dueDate: input.dueDate.toISOString(),
    };
  }
}
