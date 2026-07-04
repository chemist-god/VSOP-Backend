import { Inject, Injectable } from '@nestjs/common';
import { PortalStatus } from '@prisma/client';
import { PORTAL_REPOSITORY_PORT, PortalRepositoryPort } from '@portals/application/ports/portal-repository.port';
import { PortalNotFoundError } from '@portals/domain/errors/portal-not-found.error';

@Injectable()
export class UpdatePortalStatusUseCase {
  constructor(@Inject(PORTAL_REPOSITORY_PORT) private readonly portalRepo: PortalRepositoryPort) {}

  async execute(portalId: string, status: PortalStatus): Promise<{ id: string; status: PortalStatus }> {
    const portal = await this.portalRepo.findById(portalId);
    if (!portal) throw new PortalNotFoundError(portalId);

    if (status === PortalStatus.ACTIVE) {
      portal.activate();
    } else {
      portal.deactivate();
    }

    await this.portalRepo.savePortal(portal);
    return { id: portal.id, status: portal.status };
  }
}
