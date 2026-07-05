import { Ticket } from '@tickets/domain/entities/ticket.entity';
import { TicketCategory, TicketSeverity, TicketStatus } from '@prisma/client';

export const TICKET_REPOSITORY_PORT = Symbol('TicketRepositoryPort');

export interface TicketFilters {
  portalId?: string;
  status?: TicketStatus;
  severity?: TicketSeverity;
  assigneeId?: string;
  fromDate?: Date;
  toDate?: Date;
}

export interface TicketRepositoryPort {
  save(ticket: Ticket): Promise<void>;
  findById(id: string): Promise<Ticket | null>;
  findAll(filters?: TicketFilters): Promise<Ticket[]>;
  countByPortalAndDate(portalId: string, date: Date): Promise<number>;
}

export interface TicketDetailRecord {
  ticket: Ticket;
  notes: Array<{
    id: string;
    content: string;
    authorId: string;
    isInternal: boolean;
    createdAt: Date;
  }>;
  assignments: Array<{
    id: string;
    assigneeId: string;
    assignedBy: string;
    dueDate: Date;
    isActive: boolean;
    createdAt: Date;
  }>;
}
