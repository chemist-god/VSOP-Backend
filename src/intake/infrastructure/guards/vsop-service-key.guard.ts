import { CanActivate, ExecutionContext, Inject, Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { timingSafeEqual } from 'crypto';
import { PORTAL_REPOSITORY_PORT, PortalRepositoryPort } from '@portals/application/ports/portal-repository.port';
import { PortalRequestContext } from '@shared/infrastructure/guards/portal-api-key.guard';

@Injectable()
export class VsopServiceKeyGuard implements CanActivate {
  constructor(
    private readonly configService: ConfigService,
    @Inject(PORTAL_REPOSITORY_PORT) private readonly portalRepo: PortalRepositoryPort,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<
      PortalRequestContext & { body?: Record<string, unknown>; headers: Record<string, string | string[] | undefined> }
    >();
    const rawHeader = request.headers['x-vsop-service-key'];
    const receivedKey = Array.isArray(rawHeader) ? rawHeader[0] : rawHeader ?? '';
    const expectedKey = this.configService.get<string>('security.vsopServiceKey') ?? '';

    if (!receivedKey || !expectedKey) {
      throw new UnauthorizedException({
        code: 'INVALID_SERVICE_KEY',
        message: 'Missing service key',
      });
    }

    const receivedBuffer = Buffer.from(receivedKey);
    const expectedBuffer = Buffer.from(expectedKey);

    if (receivedBuffer.length !== expectedBuffer.length || !timingSafeEqual(receivedBuffer, expectedBuffer)) {
      throw new UnauthorizedException({
        code: 'INVALID_SERVICE_KEY',
        message: 'Invalid service key',
      });
    }

    // Multipart bodies are not parsed until FilesInterceptor runs (after guards).
    // Prefer X-Portal-Slug from the BFF; fall back to JSON body when present.
    const slugHeader = request.headers['x-portal-slug'];
    const portalSlugFromHeader = Array.isArray(slugHeader) ? slugHeader[0] : slugHeader;
    const portalSlug =
      portalSlugFromHeader ?? request.body?.portal_slug ?? request.body?.portalSlug;

    if (!portalSlug) {
      throw new UnauthorizedException({
        code: 'INVALID_PORTAL_SLUG',
        message: 'portal_slug is required',
      });
    }

    const portal = await this.portalRepo.findBySlug(String(portalSlug).trim().toLowerCase());
    if (!portal || !portal.isActive) {
      throw new UnauthorizedException({
        code: 'INVALID_PORTAL_SLUG',
        message: 'Portal not found or inactive',
      });
    }

    request.portal = portal;
    return true;
  }
}
