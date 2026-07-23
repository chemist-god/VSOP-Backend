import { Body, Controller, Get, Inject, Param, Patch, Post, Query, Req, UploadedFiles, UseGuards, UseInterceptors } from '@nestjs/common';
import { FilesInterceptor } from '@nestjs/platform-express';
import { ApiBearerAuth, ApiConsumes, ApiOperation, ApiTags } from '@nestjs/swagger';
import { TicketSeverity, TicketSource, TicketStatus, UserRole } from '@prisma/client';
import { memoryStorage } from 'multer';
import { JwtAuthGuard } from '@shared/infrastructure/guards/jwt-auth.guard';
import { Roles, RolesGuard } from '@shared/infrastructure/guards/roles.guard';
import { ListTicketsUseCase } from '@tickets/application/use-cases/list-tickets/list-tickets.use-case';
import { ChangeTicketStatusUseCase } from '@tickets/application/use-cases/change-ticket-status/change-ticket-status.use-case';
import { SetTicketSeverityUseCase } from '@tickets/application/use-cases/set-ticket-severity/set-ticket-severity.use-case';
import { AddTicketNoteUseCase } from '@tickets/application/use-cases/add-ticket-note/add-ticket-note.use-case';
import { ResolveTicketUseCase } from '@tickets/application/use-cases/resolve-ticket/resolve-ticket.use-case';
import { ResolveTicketCommand } from '@tickets/application/use-cases/resolve-ticket/resolve-ticket.command';
import { SubmitTicketForReviewUseCase } from '@tickets/application/use-cases/submit-ticket-for-review/submit-ticket-for-review.use-case';
import { SubmitTicketForReviewCommand } from '@tickets/application/use-cases/submit-ticket-for-review/submit-ticket-for-review.command';
import { CreateTicketUseCase } from '@tickets/application/use-cases/create-ticket/create-ticket.use-case';
import { CreateTicketCommand } from '@tickets/application/use-cases/create-ticket/create-ticket.command';
import { CreateTicketDto } from '@tickets/infrastructure/http/dto/create-ticket.dto';
import { AssignTicketUseCase } from '@assignments/application/use-cases/assign-ticket/assign-ticket.use-case';
import { STORAGE_PORT, StoragePort } from '@storage/application/ports/storage.port';
import { PORTAL_REPOSITORY_PORT, PortalRepositoryPort } from '@portals/application/ports/portal-repository.port';

type AuthUser = { id: string; role: UserRole };

@ApiTags('Tickets')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('tickets')
export class TicketsController {
  constructor(
    private readonly listTickets: ListTicketsUseCase,
    private readonly createTicket: CreateTicketUseCase,
    private readonly changeStatus: ChangeTicketStatusUseCase,
    private readonly setSeverity: SetTicketSeverityUseCase,
    private readonly addNote: AddTicketNoteUseCase,
    private readonly resolveTicket: ResolveTicketUseCase,
    private readonly submitForReview: SubmitTicketForReviewUseCase,
    private readonly assignTicket: AssignTicketUseCase,
    @Inject(STORAGE_PORT) private readonly storage: StoragePort,
    @Inject(PORTAL_REPOSITORY_PORT) private readonly portalRepo: PortalRepositoryPort,
  ) {}

  @Get()
  @ApiOperation({ summary: 'List tickets with optional filters' })
  list(
    @Query('portalId') portalId?: string,
    @Query('status') status?: TicketStatus,
    @Query('severity') severity?: TicketSeverity,
    @Query('assigneeId') assigneeId?: string,
    @Query('source') source?: TicketSource,
  ) {
    return this.listTickets.execute({ portalId, status, severity, assigneeId, source });
  }

  @Post()
  @Roles(UserRole.ADMIN)
  @ApiConsumes('multipart/form-data', 'application/json')
  @ApiOperation({ summary: 'Create an internal ticket / task (admin)' })
  @UseInterceptors(
    FilesInterceptor('screenshots', 3, {
      storage: memoryStorage(),
      limits: { fileSize: 5 * 1024 * 1024 },
    }),
  )
  async create(
    @Body() body: CreateTicketDto,
    @UploadedFiles() files: Array<Express.Multer.File>,
    @Req() req: { user: AuthUser },
  ) {
    let uploadSlug = 'internal';
    if (body.portalId) {
      const portal = await this.portalRepo.findById(body.portalId);
      if (portal) uploadSlug = portal.slug;
    }

    const screenshotUrls = await this.storage.uploadScreenshots(files ?? [], uploadSlug);

    return this.createTicket.execute(
      new CreateTicketCommand(
        body.description,
        req.user.id,
        body.portalId,
        body.severity,
        body.category,
        body.assigneeId,
        body.dueDate ? new Date(body.dueDate) : undefined,
        screenshotUrls,
      ),
    );
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get ticket detail' })
  getById(@Param('id') id: string) {
    return this.listTickets.executeById(id);
  }

  @Patch(':id/status')
  @ApiOperation({ summary: 'Update ticket status (role-aware)' })
  updateStatus(
    @Param('id') id: string,
    @Body() body: { status: TicketStatus },
    @Req() req: { user: AuthUser },
  ) {
    return this.changeStatus.execute(id, body.status, req.user.id, req.user.role);
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
    @Req() req: { user: AuthUser },
  ) {
    return this.addNote.execute(id, req.user.id, body.content);
  }

  @Post(':id/assign')
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Assign ticket to team member' })
  assign(
    @Param('id') id: string,
    @Body() body: { assigneeId: string; dueDate: string },
    @Req() req: { user: AuthUser },
  ) {
    return this.assignTicket.execute({
      ticketId: id,
      assigneeId: body.assigneeId,
      assignedBy: req.user.id,
      dueDate: new Date(body.dueDate),
    });
  }

  @Post(':id/submit-for-review')
  @ApiOperation({ summary: 'Submit ticket for admin review (developer or admin)' })
  submitReview(
    @Param('id') id: string,
    @Body() body: { reviewNote: string },
    @Req() req: { user: AuthUser },
  ) {
    return this.submitForReview.execute(
      new SubmitTicketForReviewCommand(
        id,
        body.reviewNote,
        req.user.id,
        req.user.role,
      ),
    );
  }

  @Post(':id/resolve')
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Resolve ticket with resolution note and email client (admin)' })
  resolve(
    @Param('id') id: string,
    @Body() body: { resolutionNote: string },
    @Req() req: { user: AuthUser },
  ) {
    return this.resolveTicket.execute(
      new ResolveTicketCommand(id, body.resolutionNote, req.user.id),
    );
  }
}
