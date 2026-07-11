import { Body, Controller, Get, Param, Patch, Post, Query, Req, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { UserRole } from '@prisma/client';
import { JwtAuthGuard } from '@shared/infrastructure/guards/jwt-auth.guard';
import { Roles, RolesGuard } from '@shared/infrastructure/guards/roles.guard';
import { Public } from '@shared/infrastructure/guards/public.decorator';
import { PrismaService } from '../../../prisma/prisma.service';
import { InviteUserUseCase } from '@users/application/use-cases/invite-user/invite-user.use-case';
import { InviteUserCommand } from '@users/application/use-cases/invite-user/invite-user.command';
import {
  AcceptInviteUseCase,
  GetInviteUseCase,
} from '@users/application/use-cases/accept-invite/accept-invite.use-case';
import { ListUsersUseCase } from '@users/application/use-cases/list-users/list-users.use-case';
import { GetTeamMemberDetailUseCase } from '@users/application/use-cases/get-team-member-detail/get-team-member-detail.use-case';
import {
  ChangeMyPasswordUseCase,
  GetMeUseCase,
  UpdateMeUseCase,
} from '@users/application/use-cases/profile/profile.use-cases';
import { UpdateUserStatusUseCase } from '@users/application/use-cases/update-user-status/update-user-status.use-case';
import {
  AcceptInviteDto,
  ChangePasswordDto,
  InviteUserDto,
  UpdateMeDto,
  UpdateUserStatusDto,
} from './dto/invite-user.dto';

@ApiTags('Team Members')
@Controller('users')
export class UsersController {
  constructor(
    private readonly inviteUser: InviteUserUseCase,
    private readonly listUsers: ListUsersUseCase,
    private readonly getMe: GetMeUseCase,
    private readonly updateMe: UpdateMeUseCase,
    private readonly changePassword: ChangeMyPasswordUseCase,
    private readonly getMemberDetail: GetTeamMemberDetailUseCase,
    private readonly updateUserStatus: UpdateUserStatusUseCase,
    private readonly prisma: PrismaService,
  ) {}

  @Get('me')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Get current user profile' })
  me(@Req() req: { user: { id: string } }) {
    return this.getMe.execute(req.user.id);
  }

  @Patch('me')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Update current user display name' })
  updateProfile(@Req() req: { user: { id: string } }, @Body() dto: UpdateMeDto) {
    return this.updateMe.execute(req.user.id, dto.name);
  }

  @Post('me/password')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Change current user password' })
  updatePassword(@Req() req: { user: { id: string } }, @Body() dto: ChangePasswordDto) {
    return this.changePassword.execute(req.user.id, dto.currentPassword, dto.newPassword);
  }

  @Post('invite')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Invite a team member by email' })
  invite(@Body() dto: InviteUserDto, @Req() req: { user: { id: string } }) {
    return this.inviteUser.execute(
      new InviteUserCommand(dto.name, dto.email, dto.role, req.user.id),
    );
  }

  @Get()
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.DEVELOPER)
  @ApiOperation({ summary: 'List team members and pending invites' })
  async list(@Req() req: { user: { role: string } }) {
    const users = await this.listUsers.execute();

    if (req.user.role !== UserRole.ADMIN) {
      return {
        members: users,
        pendingInvites: [],
      };
    }

    const invitations = await this.prisma.userInvitation.findMany({
      where: { acceptedAt: null },
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        expiresAt: true,
        createdAt: true,
      },
    });

    return {
      members: users,
      pendingInvites: invitations.map((invite) => ({
        ...invite,
        status: invite.expiresAt.getTime() < Date.now() ? 'EXPIRED' : 'PENDING',
      })),
    };
  }

  @Get(':id')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Team member profile with assignment history' })
  detail(@Param('id') id: string) {
    return this.getMemberDetail.execute(id);
  }

  @Patch(':id/status')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  @ApiOperation({
    summary: 'Activate or deactivate a team member (deactivated users cannot log in)',
  })
  updateStatus(
    @Param('id') id: string,
    @Body() dto: UpdateUserStatusDto,
    @Req() req: { user: { id: string } },
  ) {
    return this.updateUserStatus.execute(req.user.id, id, dto.isActive);
  }
}

@ApiTags('Invites')
@Controller('invites')
export class InvitesController {
  constructor(
    private readonly getInvite: GetInviteUseCase,
    private readonly acceptInvite: AcceptInviteUseCase,
  ) {}

  @Get('preview')
  @Public()
  @ApiOperation({ summary: 'Preview invitation by token' })
  preview(@Query('token') token: string) {
    return this.getInvite.execute(token);
  }

  @Post('accept')
  @Public()
  @ApiOperation({ summary: 'Accept invitation and set password' })
  accept(@Body() dto: AcceptInviteDto) {
    return this.acceptInvite.execute(dto.token, dto.password);
  }
}
