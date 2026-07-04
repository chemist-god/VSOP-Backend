import { User } from '@users/domain/entities/user.entity';

export const USER_REPOSITORY_PORT = Symbol('UserRepositoryPort');

export interface UserRepositoryPort {
  save(user: User): Promise<void>;
  findById(id: string): Promise<User | null>;
  findByEmail(email: string): Promise<User | null>;
  findByResetToken(token: string): Promise<User | null>;
  findAll(): Promise<User[]>;
  exists(email: string): Promise<boolean>;
}
