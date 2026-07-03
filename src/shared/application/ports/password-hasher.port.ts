export const PASSWORD_HASHER_PORT = Symbol('PasswordHasherPort');

export interface PasswordHasherPort {
  hash(plain: string): Promise<string>;
  compare(plain: string, hashed: string): Promise<boolean>;
}

