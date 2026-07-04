import { Body, Controller, Get, Param, Patch, Post, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { PortalStatus, UserRole } from '@prisma/client';
import { JwtAuthGuard } from '@shared/infrastructure/guards/jwt-auth.guard';
import { Roles, RolesGuard } from '@shared/infrastructure/guards/roles.guard';
import { RegisterPortalUseCase } from '@portals/application/use-cases/register-portal/register-portal.use-case';
import { RegisterPortalCommand } from '@portals/application/use-cases/register-portal/register-portal.command';
import { RegisterPortalDto } from './dto/register-portal.dto';
import { ListPortalsUseCase } from '@portals/application/use-cases/list-portals/list-portals.use-case';
import { RotatePortalKeyUseCase } from '@portals/application/use-cases/rotate-portal-key/rotate-portal-key.use-case';
import { UpdatePortalStatusUseCase } from '@portals/application/use-cases/update-portal-status/update-portal-status.use-case';

@ApiTags('Portals')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('portals')
export class PortalsController {
  constructor(
    private readonly registerPortal: RegisterPortalUseCase,
    private readonly listPortals: ListPortalsUseCase,
    private readonly rotatePortalKey: RotatePortalKeyUseCase,
    private readonly updatePortalStatus: UpdatePortalStatusUseCase,
  ) {}

  @Get()
  @ApiOperation({ summary: 'List all portals' })
  list() {
    return this.listPortals.execute();
  }

  @Post()
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Register a new portal' })
  register(@Body() dto: RegisterPortalDto) {
    return this.registerPortal.execute(
      new RegisterPortalCommand(dto.slug, dto.companyName, dto.clientAdminEmail, dto.description),
    );
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get portal detail' })
  getById(@Param('id') id: string) {
    return this.listPortals.executeById(id);
  }

  @Post(':id/rotate-key')
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Rotate portal API key' })
  rotateKey(@Param('id') id: string) {
    return this.rotatePortalKey.execute(id);
  }

  @Patch(':id/status')
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Activate or deactivate portal' })
  updateStatus(@Param('id') id: string, @Body() body: { status: PortalStatus }) {
    return this.updatePortalStatus.execute(id, body.status);
  }
}
