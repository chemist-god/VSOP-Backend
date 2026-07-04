import { Portal } from '@portals/domain/entities/portal.entity';

export const PORTAL_REPOSITORY_PORT = Symbol('PortalRepositoryPort');

export interface ApiKeyRecord {
  id: string;
  portalId: string;
  keyHash: string;
  keyPrefix: string;
  isActive: boolean;
  lastUsedAt: Date | null;
}

export interface PortalRepositoryPort {
  savePortal(portal: Portal): Promise<void>;
  findById(id: string): Promise<Portal | null>;
  findBySlug(slug: string): Promise<Portal | null>;
  findAll(): Promise<Portal[]>;
  saveApiKey(record: Omit<ApiKeyRecord, 'id'> & { id: string }): Promise<void>;
  findActiveApiKeysByPortalId(portalId: string): Promise<ApiKeyRecord[]>;
  findPortalByApiKeyHash(candidateKey: string): Promise<{ portal: Portal; keyId: string } | null>;
  deactivateApiKey(keyId: string): Promise<void>;
  markApiKeyUsed(keyId: string): Promise<void>;
}
