import { Injectable } from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import { PortalStatus } from '@prisma/client';
import { PrismaService } from '../../../prisma/prisma.service';
import { Portal } from '@portals/domain/entities/portal.entity';
import { ApiKeyRecord, PortalRepositoryPort } from '@portals/application/ports/portal-repository.port';

@Injectable()
export class PrismaPortalRepository implements PortalRepositoryPort {
  constructor(private readonly prisma: PrismaService) {}

  private toDomain(raw: {
    id: string;
    slug: string;
    companyName: string;
    clientAdminEmail: string;
    description: string | null;
    logoUrl: string | null;
    status: PortalStatus;
    createdAt: Date;
    updatedAt: Date;
  }): Portal {
    return Portal.create(
      {
        slug: raw.slug,
        companyName: raw.companyName,
        clientAdminEmail: raw.clientAdminEmail,
        description: raw.description,
        logoUrl: raw.logoUrl,
        status: raw.status,
        createdAt: raw.createdAt,
        updatedAt: raw.updatedAt,
      },
      raw.id,
    );
  }

  async savePortal(portal: Portal): Promise<void> {
    await this.prisma.portal.upsert({
      where: { id: portal.id },
      update: {
        companyName: portal.companyName,
        clientAdminEmail: portal.clientAdminEmail,
        description: portal.description ?? null,
        logoUrl: portal.logoUrl ?? null,
        status: portal.status,
      },
      create: {
        id: portal.id,
        slug: portal.slug,
        companyName: portal.companyName,
        clientAdminEmail: portal.clientAdminEmail,
        description: portal.description ?? null,
        logoUrl: portal.logoUrl ?? null,
        status: portal.status,
      },
    });
  }

  async findById(id: string): Promise<Portal | null> {
    const raw = await this.prisma.portal.findUnique({ where: { id } });
    return raw ? this.toDomain(raw) : null;
  }

  async findBySlug(slug: string): Promise<Portal | null> {
    const raw = await this.prisma.portal.findUnique({ where: { slug } });
    return raw ? this.toDomain(raw) : null;
  }

  async findAll(): Promise<Portal[]> {
    const rows = await this.prisma.portal.findMany({ orderBy: { createdAt: 'desc' } });
    return rows.map((row) => this.toDomain(row));
  }

  async saveApiKey(record: ApiKeyRecord): Promise<void> {
    await this.prisma.apiKey.create({ data: record });
  }

  async findActiveApiKeysByPortalId(portalId: string): Promise<ApiKeyRecord[]> {
    return this.prisma.apiKey.findMany({ where: { portalId, isActive: true } });
  }

  async findPortalByApiKeyHash(candidateKey: string): Promise<{ portal: Portal; keyId: string } | null> {
    const prefix = `vt_${candidateKey.substring(3, 11)}`;
    const keys = await this.prisma.apiKey.findMany({
      where: { keyPrefix: prefix, isActive: true },
      include: { portal: true },
    });

    for (const key of keys) {
      const match = await bcrypt.compare(candidateKey, key.keyHash);
      if (match) {
        return { portal: this.toDomain(key.portal), keyId: key.id };
      }
    }
    return null;
  }

  async deactivateApiKey(keyId: string): Promise<void> {
    await this.prisma.apiKey.update({ where: { id: keyId }, data: { isActive: false } });
  }

  async markApiKeyUsed(keyId: string): Promise<void> {
    await this.prisma.apiKey.update({ where: { id: keyId }, data: { lastUsedAt: new Date() } });
  }
}
