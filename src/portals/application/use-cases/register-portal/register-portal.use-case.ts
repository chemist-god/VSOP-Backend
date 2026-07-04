import { Inject, Injectable } from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import { PortalStatus } from '@prisma/client';
import { PORTAL_REPOSITORY_PORT, PortalRepositoryPort } from '@portals/application/ports/portal-repository.port';
import { ID_GENERATOR_PORT, IdGeneratorPort } from '@shared/application/ports/id-generator.port';
import { CLOCK_PORT, ClockPort } from '@shared/application/ports/clock.port';
import { Portal } from '@portals/domain/entities/portal.entity';
import { generateApiKeyPlaintext } from '@portals/domain/value-objects/portal-api-key.vo';
import { RegisterPortalCommand } from './register-portal.command';

export interface RegisterPortalResult {
  portalId: string;
  slug: string;
  apiKey: string;
}

@Injectable()
export class RegisterPortalUseCase {
  constructor(
    @Inject(PORTAL_REPOSITORY_PORT) private readonly portalRepo: PortalRepositoryPort,
    @Inject(ID_GENERATOR_PORT) private readonly idGen: IdGeneratorPort,
    @Inject(CLOCK_PORT) private readonly clock: ClockPort,
  ) {}

  async execute(command: RegisterPortalCommand): Promise<RegisterPortalResult> {
    const now = this.clock.now();
    const portalId = this.idGen.generate();

    const portal = Portal.create(
      {
        slug: command.slug.toLowerCase().trim(),
        companyName: command.companyName,
        clientAdminEmail: command.clientAdminEmail,
        description: command.description,
        status: PortalStatus.ACTIVE,
        createdAt: now,
        updatedAt: now,
      },
      portalId,
    );

    await this.portalRepo.savePortal(portal);

    const plaintext = generateApiKeyPlaintext();
    const keyHash = await bcrypt.hash(plaintext, 12);
    const keyId = this.idGen.generate();

    await this.portalRepo.saveApiKey({
      id: keyId,
      portalId,
      keyHash,
      keyPrefix: `vt_${plaintext.substring(0, 8)}`,
      isActive: true,
      lastUsedAt: null,
    });

    return { portalId, slug: portal.slug, apiKey: plaintext };
  }
}
