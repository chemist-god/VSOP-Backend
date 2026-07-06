import { Module } from '@nestjs/common';
import { IntakeController } from './infrastructure/http/intake.controller';
import { VsopServiceKeyGuard } from './infrastructure/guards/vsop-service-key.guard';
import { PortalsModule } from '../portals/portals.module';
import { TicketsModule } from '../tickets/tickets.module';
import { StorageModule } from '../storage/storage.module';
import { PortalApiKeyGuard } from '../shared/infrastructure/guards/portal-api-key.guard';

@Module({
  imports: [PortalsModule, TicketsModule, StorageModule],
  controllers: [IntakeController],
  providers: [PortalApiKeyGuard, VsopServiceKeyGuard],
})
export class IntakeModule {}
