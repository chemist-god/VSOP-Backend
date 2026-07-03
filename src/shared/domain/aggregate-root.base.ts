import { Entity } from './entity.base';

export abstract class AggregateRoot<T> extends Entity<T> {
  constructor(props: T, id: string) {
    super(props, id);
  }
}

