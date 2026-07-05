export class ResolveTicketCommand {
  constructor(
    public readonly ticketId: string,
    public readonly resolutionNote: string,
    public readonly actorId: string,
  ) {}
}
