export class RegisterPortalCommand {
  constructor(
    public readonly slug: string,
    public readonly companyName: string,
    public readonly clientAdminEmail: string,
    public readonly description?: string,
  ) {}
}
