import { Module } from '@nestjs/common';
import { PORTAL_REPOSITORY_PORT } from './application/ports/portal-repository.port';
import { PrismaPortalRepository } from './infrastructure/persistence/prisma-portal.repository';
import { RegisterPortalUseCase } from './application/use-cases/register-portal/register-portal.use-case';
import { UpdatePortalUseCase } from './application/use-cases/update-portal/update-portal.use-case';
import { ListPortalsUseCase } from './application/use-cases/list-portals/list-portals.use-case';
import { RotatePortalKeyUseCase } from './application/use-cases/rotate-portal-key/rotate-portal-key.use-case';
import { UpdatePortalStatusUseCase } from './application/use-cases/update-portal-status/update-portal-status.use-case';
import { PortalsController } from './infrastructure/http/portals.controller';

@Module({
  controllers: [PortalsController],
  providers: [
    { provide: PORTAL_REPOSITORY_PORT, useClass: PrismaPortalRepository },
    RegisterPortalUseCase,
    UpdatePortalUseCase,
    ListPortalsUseCase,
    RotatePortalKeyUseCase,
    UpdatePortalStatusUseCase,
    PrismaPortalRepository,
  ],
  exports: [PORTAL_REPOSITORY_PORT, PrismaPortalRepository],
})
export class PortalsModule {}
