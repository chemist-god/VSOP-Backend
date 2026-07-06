import { Module, forwardRef } from '@nestjs/common';
import { ASSIGNMENT_REPOSITORY_PORT } from './application/ports/assignment-repository.port';
import { PrismaAssignmentRepository } from './infrastructure/persistence/prisma-assignment.repository';
import { AssignTicketUseCase } from './application/use-cases/assign-ticket/assign-ticket.use-case';
import { TicketsModule } from '@tickets/tickets.module';
import { UsersModule } from '@users/users.module';
import { PortalsModule } from '@portals/portals.module';
import { NotificationsModule } from '@notifications/notifications.module';

@Module({
  imports: [
    forwardRef(() => TicketsModule),
    UsersModule,
    PortalsModule,
    NotificationsModule,
  ],
  providers: [
    { provide: ASSIGNMENT_REPOSITORY_PORT, useClass: PrismaAssignmentRepository },
    AssignTicketUseCase,
  ],
  exports: [AssignTicketUseCase],
})
export class AssignmentsModule {}
