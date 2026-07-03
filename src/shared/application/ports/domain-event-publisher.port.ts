import { DomainEvent } from '../../domain/domain-event.base';

export const DOMAIN_EVENT_PUBLISHER_PORT = Symbol('DomainEventPublisherPort');

export interface DomainEventPublisherPort {
  publishAll(events: DomainEvent[]): void;
}

