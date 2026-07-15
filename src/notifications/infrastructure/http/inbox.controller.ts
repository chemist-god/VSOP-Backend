import { Controller, Get, Param, Patch, Req, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '@shared/infrastructure/guards/jwt-auth.guard';
import { RolesGuard } from '@shared/infrastructure/guards/roles.guard';
import { ListInboxNotificationsUseCase } from '@notifications/application/use-cases/list-inbox-notifications.use-case';
import {
  MarkAllNotificationsReadUseCase,
  MarkNotificationReadUseCase,
} from '@notifications/application/use-cases/mark-notification-read.use-case';

@ApiTags('Inbox')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('inbox')
export class InboxController {
  constructor(
    private readonly listInbox: ListInboxNotificationsUseCase,
    private readonly markRead: MarkNotificationReadUseCase,
    private readonly markAllRead: MarkAllNotificationsReadUseCase,
  ) {}

  @Get()
  @ApiOperation({ summary: 'List personal inbox notifications' })
  list(@Req() req: { user: { id: string } }) {
    return this.listInbox.execute(req.user.id);
  }

  @Patch('read-all')
  @ApiOperation({ summary: 'Mark all inbox notifications as read' })
  readAll(@Req() req: { user: { id: string } }) {
    return this.markAllRead.execute(req.user.id);
  }

  @Patch(':id/read')
  @ApiOperation({ summary: 'Mark a notification as read' })
  readOne(@Param('id') id: string, @Req() req: { user: { id: string } }) {
    return this.markRead.execute(id, req.user.id);
  }
}
