import { Injectable } from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { DomainEventPublisherPort } from '../../application/ports/domain-event-publisher.port';
import { DomainEvent } from '../../domain/domain-event.base';

@Injectable()
export class NestEventBusAdapter implements DomainEventPublisherPort {
  constructor(private readonly eventEmitter: EventEmitter2) {}

  publishAll(events: DomainEvent[]): void {
    for (const event of events) {
      this.eventEmitter.emit(event.eventName, event);
    }
  }
}

