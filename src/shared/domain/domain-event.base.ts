export abstract class DomainEvent {
  public readonly occurredAt: Date;
  public readonly eventName: string;

  constructor(eventName: string) {
    this.occurredAt = new Date();
    this.eventName = eventName;
  }
}

