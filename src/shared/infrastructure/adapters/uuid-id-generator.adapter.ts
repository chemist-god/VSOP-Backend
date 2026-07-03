import { Injectable } from '@nestjs/common';
import { randomUUID } from 'crypto';
import { IdGeneratorPort } from '../../application/ports/id-generator.port';

@Injectable()
export class UuidIdGeneratorAdapter implements IdGeneratorPort {
  generate(): string {
    return randomUUID();
  }
}

