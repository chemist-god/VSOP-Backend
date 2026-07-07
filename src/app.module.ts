import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ThrottlerModule } from '@nestjs/throttler';
import { configuration } from './config/configuration';
import { PrismaModule } from './prisma/prisma.module';
import { SharedModule } from './shared/shared.module';
import { HealthModule } from './health/health.module';
import { AuthModule } from './auth/auth.module';
import { UsersModule } from './users/users.module';
import { PortalsModule } from './portals/portals.module';
import { IntakeModule } from './intake/intake.module';
import { TicketsModule } from './tickets/tickets.module';
import { AssignmentsModule } from './assignments/assignments.module';
import { NotificationsModule } from './notifications/notifications.module';
import { StorageModule } from './storage/storage.module';
import { AuditModule } from './audit/audit.module';
import { AgentModule } from './agent/agent.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      load: [configuration],
    }),
    ThrottlerModule.forRoot([
      { name: 'short', ttl: 1000, limit: 10 },
      { name: 'medium', ttl: 10000, limit: 50 },
    ]),
    PrismaModule,
    SharedModule,
    HealthModule,
    AuthModule,
    UsersModule,
    PortalsModule,
    IntakeModule,
    TicketsModule,
    AssignmentsModule,
    NotificationsModule,
    StorageModule,
    AuditModule,
    AgentModule,
  ],
})
export class AppModule {}
