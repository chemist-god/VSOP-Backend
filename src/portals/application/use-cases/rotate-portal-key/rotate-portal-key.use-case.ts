import { Inject, Injectable } from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import { PORTAL_REPOSITORY_PORT, PortalRepositoryPort } from '@portals/application/ports/portal-repository.port';
import { ID_GENERATOR_PORT, IdGeneratorPort } from '@shared/application/ports/id-generator.port';
import { generateApiKeyPlaintext } from '@portals/domain/value-objects/portal-api-key.vo';
import { PortalNotFoundError } from '@portals/domain/errors/portal-not-found.error';

@Injectable()
export class RotatePortalKeyUseCase {
  constructor(
    @Inject(PORTAL_REPOSITORY_PORT) private readonly portalRepo: PortalRepositoryPort,
    @Inject(ID_GENERATOR_PORT) private readonly idGen: IdGeneratorPort,
  ) {}

  async execute(portalId: string): Promise<{ apiKey: string }> {
    const portal = await this.portalRepo.findById(portalId);
    if (!portal) throw new PortalNotFoundError(portalId);

    const activeKeys = await this.portalRepo.findActiveApiKeysByPortalId(portalId);
    for (const key of activeKeys) {
      await this.portalRepo.deactivateApiKey(key.id);
    }

    const plaintext = generateApiKeyPlaintext();
    const keyHash = await bcrypt.hash(plaintext, 12);

    await this.portalRepo.saveApiKey({
      id: this.idGen.generate(),
      portalId,
      keyHash,
      keyPrefix: `vt_${plaintext.substring(0, 8)}`,
      isActive: true,
      lastUsedAt: null,
    });

    return { apiKey: plaintext };
  }
}
