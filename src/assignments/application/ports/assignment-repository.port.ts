export const ASSIGNMENT_REPOSITORY_PORT = Symbol('AssignmentRepositoryPort');

export interface AssignmentRecord {
  id: string;
  ticketId: string;
  assigneeId: string;
  assignedBy: string;
  dueDate: Date;
  isActive: boolean;
  createdAt: Date;
}

export interface AssignmentRepositoryPort {
  save(record: Omit<AssignmentRecord, 'createdAt'> & { createdAt?: Date }): Promise<void>;
  deactivateActiveByTicketId(ticketId: string): Promise<void>;
  findActiveByTicketId(ticketId: string): Promise<AssignmentRecord | null>;
}
