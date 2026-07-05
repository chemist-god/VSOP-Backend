import { Body, Controller, Get, Param, Patch, Post, Query, Req, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { TicketSeverity, TicketStatus, UserRole } from '@prisma/client';
import { JwtAuthGuard } from '@shared/infrastructure/guards/jwt-auth.guard';
import { Roles, RolesGuard } from '@shared/infrastructure/guards/roles.guard';
import { ListTicketsUseCase } from '@tickets/application/use-cases/list-tickets/list-tickets.use-case';
import { ChangeTicketStatusUseCase } from '@tickets/application/use-cases/change-ticket-status/change-ticket-status.use-case';
import { SetTicketSeverityUseCase } from '@tickets/application/use-cases/set-ticket-severity/set-ticket-severity.use-case';
import { AddTicketNoteUseCase } from '@tickets/application/use-cases/add-ticket-note/add-ticket-note.use-case';
import { ResolveTicketUseCase } from '@tickets/application/use-cases/resolve-ticket/resolve-ticket.use-case';
import { ResolveTicketCommand } from '@tickets/application/use-cases/resolve-ticket/resolve-ticket.command';
import { AssignTicketUseCase } from '@assignments/application/use-cases/assign-ticket/assign-ticket.use-case';

@ApiTags('Tickets')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('tickets')
export class TicketsController {
  constructor(
    private readonly listTickets: ListTicketsUseCase,
    private readonly changeStatus: ChangeTicketStatusUseCase,
    private readonly setSeverity: SetTicketSeverityUseCase,
    private readonly addNote: AddTicketNoteUseCase,
    private readonly resolveTicket: ResolveTicketUseCase,
    private readonly assignTicket: AssignTicketUseCase,
  ) {}

  @Get()
  @ApiOperation({ summary: 'List tickets with optional filters' })
  list(
    @Query('portalId') portalId?: string,
    @Query('status') status?: TicketStatus,
    @Query('severity') severity?: TicketSeverity,
    @Query('assigneeId') assigneeId?: string,
  ) {
    return this.listTickets.execute({ portalId, status, severity, assigneeId });
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get ticket detail' })
  getById(@Param('id') id: string) {
    return this.listTickets.executeById(id);
  }

  @Patch(':id/status')
  @ApiOperation({ summary: 'Update ticket status' })
  updateStatus(
    @Param('id') id: string,
    @Body() body: { status: TicketStatus },
    @Req() req: { user: { id: string } },
  ) {
    return this.changeStatus.execute(id, body.status, req.user.id);
  }

  @Patch(':id/severity')
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Set ticket severity' })
  updateSeverity(@Param('id') id: string, @Body() body: { severity: TicketSeverity }) {
    return this.setSeverity.execute(id, body.severity);
  }

  @Post(':id/notes')
  @ApiOperation({ summary: 'Add internal note to ticket' })
  createNote(
    @Param('id') id: string,
    @Body() body: { content: string },
    @Req() req: { user: { id: string } },
  ) {
    return this.addNote.execute(id, req.user.id, body.content);
  }

  @Post(':id/assign')
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Assign ticket to team member' })
  assign(
    @Param('id') id: string,
    @Body() body: { assigneeId: string; dueDate: string },
    @Req() req: { user: { id: string } },
  ) {
    return this.assignTicket.execute({
      ticketId: id,
      assigneeId: body.assigneeId,
      assignedBy: req.user.id,
      dueDate: new Date(body.dueDate),
    });
  }

  @Post(':id/resolve')
  @ApiOperation({ summary: 'Resolve ticket with resolution note' })
  resolve(
    @Param('id') id: string,
    @Body() body: { resolutionNote: string },
    @Req() req: { user: { id: string } },
  ) {
    return this.resolveTicket.execute(
      new ResolveTicketCommand(id, body.resolutionNote, req.user.id),
    );
  }
}
