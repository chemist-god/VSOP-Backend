import { ValueObject } from '@shared/domain/value-object.base';
import { randomBytes } from 'crypto';

interface ApiKeyProps {
  prefix: string;
  plaintext: string | null;
  hash: string;
}

export class PortalApiKey extends ValueObject<ApiKeyProps> {
  static generate(hash: string, prefix: string): PortalApiKey {
    return new PortalApiKey({ prefix, plaintext: null, hash });
  }

  static fromGeneration(plaintext: string, hash: string): PortalApiKey {
    const prefix = `vt_${plaintext.substring(0, 8)}`;
    return new PortalApiKey({ prefix, plaintext, hash });
  }

  get prefix(): string {
    return this.props.prefix;
  }

  get hash(): string {
    return this.props.hash;
  }

  get plaintext(): string | null {
    return this.props.plaintext;
  }
}

export function generateApiKeyPlaintext(): string {
  return `vt_live_${randomBytes(24).toString('hex')}`;
}
