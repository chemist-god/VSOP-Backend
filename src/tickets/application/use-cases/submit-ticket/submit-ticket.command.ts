import { TicketCategory } from '@prisma/client';

export class SubmitTicketCommand {
  constructor(
    public readonly portalId: string,
    public readonly portalSlug: string,
    public readonly description: string,
    public readonly contactName?: string,
    public readonly browserInfo?: Record<string, unknown>,
    public readonly screenshotUrls?: string[],
    public readonly category?: TicketCategory,
    public readonly tags?: string[],
  ) {}
}
