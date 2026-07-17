import { OnboardingStep } from '@prisma/client';
import { CURRENT_TERMS_VERSION } from './terms.constants';

/**
 * The stored `onboardingStep` can go stale when terms are re-versioned:
 * a user who finished the tour long ago still has `onboardingStep = COMPLETE`,
 * but a terms bump means they must re-accept without replaying the tour.
 * Client-facing responses normalize to `AGREEMENT` in that case; the persisted
 * value is left untouched so a future terms version keeps the tour marked done.
 */
export function resolveOnboardingStepForClient(user: {
  tourCompleted: boolean;
  onboardingStep: OnboardingStep;
  termsVersion?: string | null;
}): OnboardingStep {
  if (user.tourCompleted && user.termsVersion !== CURRENT_TERMS_VERSION) {
    return OnboardingStep.AGREEMENT;
  }
  return user.onboardingStep;
}
