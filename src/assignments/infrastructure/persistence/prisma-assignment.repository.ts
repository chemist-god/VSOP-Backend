import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../prisma/prisma.service';
import {
  AssignmentRecord,
  AssignmentRepositoryPort,
} from '@assignments/application/ports/assignment-repository.port';

@Injectable()
export class PrismaAssignmentRepository implements AssignmentRepositoryPort {
  constructor(private readonly prisma: PrismaService) {}

  async save(record: Omit<AssignmentRecord, 'createdAt'> & { createdAt?: Date }): Promise<void> {
    await this.prisma.assignment.create({
      data: {
        id: record.id,
        ticketId: record.ticketId,
        assigneeId: record.assigneeId,
        assignedBy: record.assignedBy,
        dueDate: record.dueDate,
        isActive: record.isActive,
      },
    });
  }

  async deactivateActiveByTicketId(ticketId: string): Promise<void> {
    await this.prisma.assignment.updateMany({
      where: { ticketId, isActive: true },
      data: { isActive: false },
    });
  }

  async findActiveByTicketId(ticketId: string): Promise<AssignmentRecord | null> {
    const row = await this.prisma.assignment.findFirst({
      where: { ticketId, isActive: true },
      orderBy: { createdAt: 'desc' },
    });
    return row ?? null;
  }
}
