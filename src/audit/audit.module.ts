import { Module } from '@nestjs/common';
import { AuditEventListener } from './application/listeners/audit-event.listener';
import {
  GetInsightsUseCase,
  ListAuditLogsUseCase,
} from './application/use-cases/audit-insights.use-cases';
import { AuditController } from './infrastructure/http/audit.controller';

@Module({
  controllers: [AuditController],
  providers: [AuditEventListener, ListAuditLogsUseCase, GetInsightsUseCase],
})
export class AuditModule {}
