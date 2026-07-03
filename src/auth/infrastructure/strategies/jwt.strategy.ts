import { Inject, Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { USER_REPOSITORY_PORT, UserRepositoryPort } from '@users/application/ports/user-repository.port';

export interface JwtPayload {
  sub: string;
  email: string;
  role: string;
}

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(
    config: ConfigService,
    @Inject(USER_REPOSITORY_PORT) private readonly userRepo: UserRepositoryPort,
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: config.get<string>('jwt.secret'),
    });
  }

  async validate(payload: JwtPayload): Promise<{ id: string; email: string; role: string }> {
    const user = await this.userRepo.findById(payload.sub);
    if (!user || !user.isActive) {
      throw new UnauthorizedException({
        code: 'UNAUTHORIZED',
        message: 'User not found or deactivated',
      });
    }
    return { id: payload.sub, email: payload.email, role: payload.role };
  }
}
