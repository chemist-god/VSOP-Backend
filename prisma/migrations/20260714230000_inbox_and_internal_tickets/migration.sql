-- CreateEnum
CREATE TYPE "TicketSource" AS ENUM ('INTAKE', 'INTERNAL');

-- CreateEnum
CREATE TYPE "InAppNotificationType" AS ENUM ('TICKET_CREATED', 'TICKET_ASSIGNED', 'TICKET_RESOLVED');

-- AlterTable
ALTER TABLE "tickets" ADD COLUMN "source" "TicketSource" NOT NULL DEFAULT 'INTAKE';
ALTER TABLE "tickets" ADD COLUMN "createdById" TEXT;
ALTER TABLE "tickets" ALTER COLUMN "portalId" DROP NOT NULL;

-- CreateTable
CREATE TABLE "in_app_notifications" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "type" "InAppNotificationType" NOT NULL,
    "title" TEXT NOT NULL,
    "body" TEXT NOT NULL,
    "ticketId" TEXT,
    "readAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "in_app_notifications_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "tickets_source_createdAt_idx" ON "tickets"("source", "createdAt");

-- CreateIndex
CREATE INDEX "tickets_createdById_idx" ON "tickets"("createdById");

-- CreateIndex
CREATE INDEX "in_app_notifications_userId_createdAt_idx" ON "in_app_notifications"("userId", "createdAt");

-- CreateIndex
CREATE INDEX "in_app_notifications_userId_readAt_idx" ON "in_app_notifications"("userId", "readAt");

-- AddForeignKey
ALTER TABLE "tickets" ADD CONSTRAINT "tickets_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "in_app_notifications" ADD CONSTRAINT "in_app_notifications_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "in_app_notifications" ADD CONSTRAINT "in_app_notifications_ticketId_fkey" FOREIGN KEY ("ticketId") REFERENCES "tickets"("id") ON DELETE SET NULL ON UPDATE CASCADE;
