import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { UserRole } from '@prisma/client';
import { JwtAuthGuard } from '@shared/infrastructure/guards/jwt-auth.guard';
import { Roles, RolesGuard } from '@shared/infrastructure/guards/roles.guard';
import {
  GetInsightsUseCase,
  ListAuditLogsUseCase,
} from '../../application/use-cases/audit-insights.use-cases';

@ApiTags('Audit')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller()
export class AuditController {
  constructor(
    private readonly listAudit: ListAuditLogsUseCase,
    private readonly insights: GetInsightsUseCase,
  ) {}

  @Get('audit')
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'List recent audit activity' })
  list(@Query('limit') limit?: string, @Query('page') page?: string) {
    return this.listAudit.execute({
      limit: limit ? Number(limit) : 20,
      page: page ? Number(page) : 1,
    });
  }

  @Get('insights')
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Operational insights aggregates' })
  getInsights(@Query('days') days?: string) {
    return this.insights.execute(days ? Number(days) : undefined);
  }
}
