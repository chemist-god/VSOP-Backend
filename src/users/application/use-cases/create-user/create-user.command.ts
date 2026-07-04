import { UserRole } from '@prisma/client';

export class CreateUserCommand {
  constructor(
    public readonly name: string,
    public readonly email: string,
    public readonly role: UserRole,
    public readonly temporaryPassword: string,
  ) {}
}
