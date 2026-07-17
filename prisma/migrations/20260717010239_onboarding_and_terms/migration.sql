-- CreateEnum
CREATE TYPE "OnboardingStep" AS ENUM ('PRODUCT_TOUR', 'SPOTLIGHTS', 'AGREEMENT', 'COMPLETE');

-- AlterTable
ALTER TABLE "users" ADD COLUMN     "acceptedTermsAt" TIMESTAMP(3),
ADD COLUMN     "onboardingStep" "OnboardingStep" NOT NULL DEFAULT 'PRODUCT_TOUR',
ADD COLUMN     "termsVersion" TEXT,
ADD COLUMN     "tourCompleted" BOOLEAN NOT NULL DEFAULT false;

-- Grandfather existing users: they never saw the first-login tour/terms flow,
-- so mark them as already through it rather than forcing a replay.
UPDATE "users"
SET "tourCompleted" = true,
    "onboardingStep" = 'COMPLETE',
    "acceptedTermsAt" = now(),
    "termsVersion" = 'v1.0.0';
