import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { ConfigService } from '@nestjs/config';
import { UsersModule } from '@users/users.module';
import { JwtStrategy } from './infrastructure/strategies/jwt.strategy';
import { LoginUseCase } from './application/use-cases/login/login.use-case';
import { AuthController } from './infrastructure/http/auth.controller';

@Module({
  imports: [
    UsersModule,
    PassportModule,
    JwtModule.registerAsync({
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        secret: config.get<string>('jwt.secret'),
        signOptions: { expiresIn: config.get<string>('jwt.expiresIn') },
      }),
    }),
  ],
  controllers: [AuthController],
  providers: [JwtStrategy, LoginUseCase],
  exports: [JwtModule],
})
export class AuthModule {}
