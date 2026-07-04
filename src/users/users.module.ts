import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { USER_REPOSITORY_PORT } from './application/ports/user-repository.port';
import { PrismaUserRepository } from './infrastructure/persistence/prisma-user.repository';
import { ListUsersUseCase } from './application/use-cases/list-users/list-users.use-case';
import { InviteUserUseCase } from './application/use-cases/invite-user/invite-user.use-case';
import {
  AcceptInviteUseCase,
  GetInviteUseCase,
} from './application/use-cases/accept-invite/accept-invite.use-case';
import {
  ChangeMyPasswordUseCase,
  GetMeUseCase,
  UpdateMeUseCase,
} from './application/use-cases/profile/profile.use-cases';
import { GetTeamMemberDetailUseCase } from './application/use-cases/get-team-member-detail/get-team-member-detail.use-case';
import { InvitesController, UsersController } from './infrastructure/http/users.controller';
import { NotificationsModule } from '@notifications/notifications.module';

@Module({
  imports: [
    NotificationsModule,
    JwtModule.registerAsync({
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        secret: config.get<string>('jwt.secret'),
        signOptions: { expiresIn: config.get<string>('jwt.expiresIn') },
      }),
    }),
  ],
  controllers: [UsersController, InvitesController],
  providers: [
    { provide: USER_REPOSITORY_PORT, useClass: PrismaUserRepository },
    ListUsersUseCase,
    InviteUserUseCase,
    GetInviteUseCase,
    AcceptInviteUseCase,
    GetMeUseCase,
    UpdateMeUseCase,
    ChangeMyPasswordUseCase,
    GetTeamMemberDetailUseCase,
  ],
  exports: [USER_REPOSITORY_PORT],
})
export class UsersModule {}
