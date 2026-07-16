import { Inject, Injectable } from '@nestjs/common';
import { PORTAL_REPOSITORY_PORT, PortalRepositoryPort } from '@portals/application/ports/portal-repository.port';
import { PortalNotFoundError } from '@portals/domain/errors/portal-not-found.error';

@Injectable()
export class ListPortalsUseCase {
  constructor(@Inject(PORTAL_REPOSITORY_PORT) private readonly portalRepo: PortalRepositoryPort) {}

  async execute() {
    const portals = await this.portalRepo.findAll();
    return portals.map((portal) => ({
      id: portal.id,
      slug: portal.slug,
      companyName: portal.companyName,
      clientAdminEmail: portal.clientAdminEmail,
      description: portal.description ?? null,
      logoUrl: portal.logoUrl ?? null,
      status: portal.status,
    }));
  }

  async executeById(id: string) {
    const portal = await this.portalRepo.findById(id);
    if (!portal) throw new PortalNotFoundError(id);
    return {
      id: portal.id,
      slug: portal.slug,
      companyName: portal.companyName,
      clientAdminEmail: portal.clientAdminEmail,
      description: portal.description ?? null,
      logoUrl: portal.logoUrl ?? null,
      status: portal.status,
    };
  }
}
