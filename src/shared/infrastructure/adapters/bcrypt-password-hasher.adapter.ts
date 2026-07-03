import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as bcrypt from 'bcrypt';
import { PasswordHasherPort } from '../../application/ports/password-hasher.port';

@Injectable()
export class BcryptPasswordHasherAdapter implements PasswordHasherPort {
  constructor(private readonly configService: ConfigService) {}

  async hash(plain: string): Promise<string> {
    const rounds = this.configService.get<number>('security.bcryptRounds') ?? 12;
    return bcrypt.hash(plain, rounds);
  }

  async compare(plain: string, hashed: string): Promise<boolean> {
    return bcrypt.compare(plain, hashed);
  }
}

