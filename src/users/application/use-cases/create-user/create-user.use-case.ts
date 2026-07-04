import { Inject, Injectable } from '@nestjs/common';
import { USER_REPOSITORY_PORT, UserRepositoryPort } from '@users/application/ports/user-repository.port';
import { ID_GENERATOR_PORT, IdGeneratorPort } from '@shared/application/ports/id-generator.port';
import { PASSWORD_HASHER_PORT, PasswordHasherPort } from '@shared/application/ports/password-hasher.port';
import { CLOCK_PORT, ClockPort } from '@shared/application/ports/clock.port';
import { User } from '@users/domain/entities/user.entity';
import { EmailAddress } from '@users/domain/value-objects/email-address.vo';
import { DuplicateEmailError } from '@users/domain/errors/duplicate-email.error';
import { CreateUserCommand } from './create-user.command';

@Injectable()
export class CreateUserUseCase {
  constructor(
    @Inject(USER_REPOSITORY_PORT) private readonly userRepo: UserRepositoryPort,
    @Inject(ID_GENERATOR_PORT) private readonly idGen: IdGeneratorPort,
    @Inject(PASSWORD_HASHER_PORT) private readonly hasher: PasswordHasherPort,
    @Inject(CLOCK_PORT) private readonly clock: ClockPort,
  ) {}

  async execute(command: CreateUserCommand): Promise<{ userId: string }> {
    const emailVo = EmailAddress.create(command.email);

    const alreadyExists = await this.userRepo.exists(emailVo.value);
    if (alreadyExists) throw new DuplicateEmailError(emailVo.value);

    const passwordHash = await this.hasher.hash(command.temporaryPassword);
    const now = this.clock.now();

    const user = User.create(
      {
        name: command.name,
        email: emailVo,
        passwordHash,
        role: command.role,
        isActive: true,
        createdAt: now,
        updatedAt: now,
      },
      this.idGen.generate(),
    );

    await this.userRepo.save(user);
    return { userId: user.id };
  }
}
