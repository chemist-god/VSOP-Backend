-- AlterEnum: TicketStatus
ALTER TYPE "TicketStatus" ADD VALUE 'PENDING_REVIEW';

-- AlterEnum: InAppNotificationType
ALTER TYPE "InAppNotificationType" ADD VALUE 'TICKET_READY_FOR_REVIEW';
