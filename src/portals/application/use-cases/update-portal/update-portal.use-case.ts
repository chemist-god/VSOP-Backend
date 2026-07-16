import { BadRequestException, Inject, Injectable } from '@nestjs/common';
import { PORTAL_REPOSITORY_PORT, PortalRepositoryPort } from '@portals/application/ports/portal-repository.port';
import { PortalNotFoundError } from '@portals/domain/errors/portal-not-found.error';
import { UpdatePortalCommand } from './update-portal.command';

@Injectable()
export class UpdatePortalUseCase {
  constructor(
    @Inject(PORTAL_REPOSITORY_PORT) private readonly portalRepo: PortalRepositoryPort,
  ) {}

  async execute(command: UpdatePortalCommand) {
    const portal = await this.portalRepo.findById(command.portalId);
    if (!portal) throw new PortalNotFoundError(command.portalId);

    const companyName = command.companyName?.trim();
    const clientAdminEmail = command.clientAdminEmail?.trim();
    if (!companyName) throw new BadRequestException('Company name is required');
    if (!clientAdminEmail) throw new BadRequestException('Client admin email is required');

    portal.updateProfile({
      companyName,
      clientAdminEmail,
      description: command.description,
      logoUrl: command.logoUrl,
    });

    await this.portalRepo.savePortal(portal);

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
