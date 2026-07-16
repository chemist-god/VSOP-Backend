export class UpdatePortalCommand {
  constructor(
    public readonly portalId: string,
    public readonly companyName: string,
    public readonly clientAdminEmail: string,
    public readonly description?: string | null,
    public readonly logoUrl?: string | null,
  ) {}
}
