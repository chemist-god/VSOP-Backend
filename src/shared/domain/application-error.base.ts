export abstract class ApplicationError extends Error {
  public readonly code: string;
  public readonly statusHint: number;

  constructor(message: string, code: string, statusHint = 400) {
    super(message);
    this.code = code;
    this.statusHint = statusHint;
    this.name = this.constructor.name;
  }
}

