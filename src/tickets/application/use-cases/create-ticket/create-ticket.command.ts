import { TicketCategory, TicketSeverity } from '@prisma/client';

export class CreateTicketCommand {
  constructor(
    public readonly description: string,
    public readonly createdById: string,
    public readonly portalId?: string | null,
    public readonly severity?: TicketSeverity,
    public readonly category?: TicketCategory,
    public readonly assigneeId?: string,
    public readonly dueDate?: Date,
  ) {}
}
