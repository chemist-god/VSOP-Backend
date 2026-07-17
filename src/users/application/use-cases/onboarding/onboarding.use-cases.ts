import { BadRequestException, Inject, Injectable } from '@nestjs/common';
import { OnboardingStep } from '@prisma/client';
import { PrismaService } from '../../../../prisma/prisma.service';
import { USER_REPOSITORY_PORT, UserRepositoryPort } from '@users/application/ports/user-repository.port';
import { CLOCK_PORT, ClockPort } from '@shared/application/ports/clock.port';
import { UserNotFoundError } from '@users/domain/errors/user-not-found.error';
import { CURRENT_TERMS_VERSION } from '@users/domain/terms.constants';
import { resolveOnboardingStepForClient } from '@users/domain/onboarding.util';

/**
 * Persists the user's resume point in the first-login flow.
 * Advancing past SPOTLIGHTS flips `tourCompleted` (see `User.setOnboardingStep`)
 * so a later terms bump skips straight to the agreement step.
 */
@Injectable()
export class UpdateOnboardingStepUseCase {
  constructor(@Inject(USER_REPOSITORY_PORT) private readonly userRepo: UserRepositoryPort) {}

  async execute(userId: string, step: OnboardingStep) {
    const user = await this.userRepo.findById(userId);
    if (!user) throw new UserNotFoundError(userId);

    user.setOnboardingStep(step);
    await this.userRepo.save(user);

    return {
      tourCompleted: user.tourCompleted,
      onboardingStep: resolveOnboardingStepForClient(user),
      acceptedTermsAt: user.acceptedTermsAt ?? null,
      termsVersion: user.termsVersion ?? null,
    };
  }
}

/**
 * Records legal acceptance and returns the full updated AuthUser so the
 * frontend can replace its stored session before navigating to the dashboard.
 *
 * Follow-up (out of scope for v1): persist acceptance history in a dedicated
 * `UserTermsAcceptance` table (id, userId, version, acceptedAt) so v1 -> v2 -> v3
 * transitions are auditable. For now the latest acceptance lives on `User`
 * itself, which is all the onboarding gate needs.
 */
@Injectable()
export class AcceptTermsUseCase {
  constructor(
    @Inject(USER_REPOSITORY_PORT) private readonly userRepo: UserRepositoryPort,
    @Inject(CLOCK_PORT) private readonly clock: ClockPort,
    private readonly prisma: PrismaService,
  ) {}

  async execute(userId: string, termsVersion: string) {
    const user = await this.userRepo.findById(userId);
    if (!user) throw new UserNotFoundError(userId);

    if (termsVersion !== CURRENT_TERMS_VERSION) {
      throw new BadRequestException({
        code: 'TERMS_VERSION_MISMATCH',
        message: `Terms version "${termsVersion}" is out of date. Expected "${CURRENT_TERMS_VERSION}".`,
      });
    }

    const now = this.clock.now();
    user.acceptTerms(termsVersion, now);
    await this.userRepo.save(user);

    await this.prisma.auditLog.create({
      data: {
        entityType: 'user',
        entityId: user.id,
        action: 'user.terms_accepted',
        actorId: user.id,
        actorType: 'USER',
        afterState: { termsVersion, acceptedAt: now },
      },
    });

    return {
      id: user.id,
      name: user.name,
      email: user.email.value,
      role: user.role,
      tourCompleted: user.tourCompleted,
      onboardingStep: resolveOnboardingStepForClient(user),
      acceptedTermsAt: user.acceptedTermsAt ?? null,
      termsVersion: user.termsVersion ?? null,
    };
  }
}
