import { Inject, Injectable } from '@nestjs/common';
import { UserRole } from '@prisma/client';
import { USER_REPOSITORY_PORT, UserRepositoryPort } from '@users/application/ports/user-repository.port';

export interface UserListItem {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  isActive: boolean;
}

@Injectable()
export class ListUsersUseCase {
  constructor(@Inject(USER_REPOSITORY_PORT) private readonly userRepo: UserRepositoryPort) {}

  async execute(): Promise<UserListItem[]> {
    const users = await this.userRepo.findAll();
    return users.map((user) => ({
      id: user.id,
      name: user.name,
      email: user.email.value,
      role: user.role,
      isActive: user.isActive,
    }));
  }
}
