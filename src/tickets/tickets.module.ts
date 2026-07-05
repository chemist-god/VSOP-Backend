import { Module, forwardRef } from '@nestjs/common';
import { TICKET_REPOSITORY_PORT } from './application/ports/ticket-repository.port';
import { PrismaTicketRepository } from './infrastructure/persistence/prisma-ticket.repository';
import { SubmitTicketUseCase } from './application/use-cases/submit-ticket/submit-ticket.use-case';
import { ResolveTicketUseCase } from './application/use-cases/resolve-ticket/resolve-ticket.use-case';
import { ListTicketsUseCase } from './application/use-cases/list-tickets/list-tickets.use-case';
import { ChangeTicketStatusUseCase } from './application/use-cases/change-ticket-status/change-ticket-status.use-case';
import { SetTicketSeverityUseCase } from './application/use-cases/set-ticket-severity/set-ticket-severity.use-case';
import { AddTicketNoteUseCase } from './application/use-cases/add-ticket-note/add-ticket-note.use-case';
import { TicketsController } from './infrastructure/http/tickets.controller';
import { PortalsModule } from '@portals/portals.module';
import { AssignmentsModule } from '@assignments/assignments.module';

@Module({
  imports: [PortalsModule, forwardRef(() => AssignmentsModule)],
  controllers: [TicketsController],
  providers: [
    { provide: TICKET_REPOSITORY_PORT, useClass: PrismaTicketRepository },
    PrismaTicketRepository,
    SubmitTicketUseCase,
    ResolveTicketUseCase,
    ListTicketsUseCase,
    ChangeTicketStatusUseCase,
    SetTicketSeverityUseCase,
    AddTicketNoteUseCase,
  ],
  exports: [TICKET_REPOSITORY_PORT, SubmitTicketUseCase, ResolveTicketUseCase, PrismaTicketRepository],
})
export class TicketsModule {}
