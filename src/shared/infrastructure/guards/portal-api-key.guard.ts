import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Inject,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { PORTAL_REPOSITORY_PORT, PortalRepositoryPort } from '@portals/application/ports/portal-repository.port';
import { Portal } from '@portals/domain/entities/portal.entity';

export interface PortalRequestContext {
  portal: Portal;
  apiKeyId?: string;
}

@Injectable()
export class PortalApiKeyGuard implements CanActivate {
  constructor(
    @Inject(PORTAL_REPOSITORY_PORT) private readonly portalRepo: PortalRepositoryPort,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<PortalRequestContext & { headers: Record<string, string | string[] | undefined> }>();
    const rawAuthorizationHeader = request.headers['authorization'];
    const authorizationHeader = Array.isArray(rawAuthorizationHeader)
      ? rawAuthorizationHeader[0]
      : rawAuthorizationHeader ?? '';

    if (!authorizationHeader.startsWith('Bearer ')) {
      throw new UnauthorizedException({
        code: 'INVALID_API_KEY',
        message: 'Missing portal API key',
      });
    }

    const candidateKey = authorizationHeader.replace('Bearer ', '').trim();
    const result = await this.portalRepo.findPortalByApiKeyHash(candidateKey);

    if (!result) {
      throw new UnauthorizedException({
        code: 'INVALID_API_KEY',
        message: 'Invalid portal API key',
      });
    }

    if (!result.portal.isActive) {
      throw new ForbiddenException({
        code: 'PORTAL_INACTIVE',
        message: 'This portal is inactive',
      });
    }

    request.portal = result.portal;
    request.apiKeyId = result.keyId;

    this.portalRepo.markApiKeyUsed(result.keyId).catch(() => null);

    return true;
  }
}
