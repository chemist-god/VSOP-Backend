import { Global, Module } from '@nestjs/common';
import { EventEmitterModule } from '@nestjs/event-emitter';
import { CLOCK_PORT } from './application/ports/clock.port';
import { DOMAIN_EVENT_PUBLISHER_PORT } from './application/ports/domain-event-publisher.port';
import { ID_GENERATOR_PORT } from './application/ports/id-generator.port';
import { PASSWORD_HASHER_PORT } from './application/ports/password-hasher.port';
import { BcryptPasswordHasherAdapter } from './infrastructure/adapters/bcrypt-password-hasher.adapter';
import { NestEventBusAdapter } from './infrastructure/adapters/nest-event-bus.adapter';
import { SystemClockAdapter } from './infrastructure/adapters/system-clock.adapter';
import { UuidIdGeneratorAdapter } from './infrastructure/adapters/uuid-id-generator.adapter';

@Global()
@Module({
  imports: [
    EventEmitterModule.forRoot({
      wildcard: true,
    }),
  ],
  providers: [
    { provide: CLOCK_PORT, useClass: SystemClockAdapter },
    { provide: ID_GENERATOR_PORT, useClass: UuidIdGeneratorAdapter },
    { provide: PASSWORD_HASHER_PORT, useClass: BcryptPasswordHasherAdapter },
    { provide: DOMAIN_EVENT_PUBLISHER_PORT, useClass: NestEventBusAdapter },
    SystemClockAdapter,
    UuidIdGeneratorAdapter,
    BcryptPasswordHasherAdapter,
    NestEventBusAdapter,
  ],
  exports: [
    CLOCK_PORT,
    ID_GENERATOR_PORT,
    PASSWORD_HASHER_PORT,
    DOMAIN_EVENT_PUBLISHER_PORT,
  ],
})
export class SharedModule {}

