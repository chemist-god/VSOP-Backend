import { UserRole } from '@prisma/client';

export class InviteUserCommand {
  constructor(
    public readonly name: string,
    public readonly email: string,
    public readonly role: UserRole,
    public readonly invitedById: string,
  ) {}
}
