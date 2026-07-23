import { UserRole } from '@prisma/client';

export class SubmitTicketForReviewCommand {
  constructor(
    public readonly ticketId: string,
    public readonly reviewNote: string,
    public readonly actorId: string,
    public readonly actorRole: UserRole,
  ) {}
}
