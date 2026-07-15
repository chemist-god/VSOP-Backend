import { Injectable } from '@nestjs/common';
import { Prisma, TicketSeverity, TicketSource, TicketStatus } from '@prisma/client';
import { PrismaService } from '../../../prisma/prisma.service';
import { Ticket } from '@tickets/domain/entities/ticket.entity';
import { TicketDetailRecord, TicketFilters, TicketRepositoryPort } from '@tickets/application/ports/ticket-repository.port';

@Injectable()
export class PrismaTicketRepository implements TicketRepositoryPort {
  constructor(private readonly prisma: PrismaService) {}

  private toDomain(raw: {
    id: string;
    portalId: string | null;
    source: TicketSource;
    createdById: string | null;
    referenceId: string;
    status: TicketStatus;
    severity: TicketSeverity;
    category: import('@prisma/client').TicketCategory;
    tags: string[];
    description: string;
    contactName: string | null;
    browserInfo: Prisma.JsonValue;
    screenshotUrls: string[];
    resolutionNote: string | null;
    resolvedAt: Date | null;
    closedAt: Date | null;
    createdAt: Date;
    updatedAt: Date;
  }): Ticket {
    return Ticket.create(
      {
        portalId: raw.portalId,
        source: raw.source,
        createdById: raw.createdById,
        referenceId: raw.referenceId,
        status: raw.status,
        severity: raw.severity,
        category: raw.category,
        tags: raw.tags ?? [],
        description: raw.description,
        contactName: raw.contactName,
        browserInfo: raw.browserInfo as Record<string, unknown> | null,
        screenshotUrls: raw.screenshotUrls ?? [],
        resolutionNote: raw.resolutionNote,
        resolvedAt: raw.resolvedAt,
        closedAt: raw.closedAt,
        createdAt: raw.createdAt,
        updatedAt: raw.updatedAt,
      },
      raw.id,
    );
  }

  async save(ticket: Ticket): Promise<void> {
    await this.prisma.ticket.upsert({
      where: { id: ticket.id },
      update: {
        status: ticket.status,
        severity: ticket.severity,
        category: ticket.category,
        tags: ticket.tags,
        resolutionNote: ticket.resolutionNote ?? null,
        screenshotUrls: ticket.screenshotUrls,
        resolvedAt: ticket.resolvedAt ?? null,
        closedAt: ticket.closedAt ?? null,
      },
      create: {
        id: ticket.id,
        referenceId: ticket.referenceId,
        portalId: ticket.portalId ?? null,
        source: ticket.source,
        createdById: ticket.createdById ?? null,
        status: ticket.status,
        severity: ticket.severity,
        category: ticket.category,
        tags: ticket.tags,
        description: ticket.description,
        contactName: ticket.contactName ?? null,
        browserInfo: (ticket.browserInfo ?? undefined) as Prisma.InputJsonValue | undefined,
        screenshotUrls: ticket.screenshotUrls,
      },
    });
  }

  async findById(id: string): Promise<Ticket | null> {
    const raw = await this.prisma.ticket.findUnique({ where: { id } });
    return raw ? this.toDomain(raw) : null;
  }

  async findAll(filters?: TicketFilters): Promise<Ticket[]> {
    const rows = await this.prisma.ticket.findMany({
      where: {
        ...(filters?.portalId && { portalId: filters.portalId }),
        ...(filters?.status && { status: filters.status }),
        ...(filters?.severity && { severity: filters.severity }),
        ...(filters?.source && { source: filters.source }),
        ...(filters?.fromDate && { createdAt: { gte: filters.fromDate } }),
        ...(filters?.toDate && { createdAt: { lte: filters.toDate } }),
        ...(filters?.assigneeId && {
          assignments: {
            some: { assigneeId: filters.assigneeId, isActive: true },
          },
        }),
      },
      orderBy: { createdAt: 'desc' },
    });
    return rows.map((row) => this.toDomain(row));
  }

  async countByPortalAndDate(portalId: string, date: Date): Promise<number> {
    const { start, end } = dayBounds(date);
    return this.prisma.ticket.count({
      where: { portalId, createdAt: { gte: start, lte: end } },
    });
  }

  async countInternalByDate(date: Date): Promise<number> {
    const { start, end } = dayBounds(date);
    return this.prisma.ticket.count({
      where: {
        source: TicketSource.INTERNAL,
        createdAt: { gte: start, lte: end },
      },
    });
  }

  async findDetailById(id: string): Promise<TicketDetailRecord | null> {
    const raw = await this.prisma.ticket.findUnique({
      where: { id },
      include: {
        notes: { orderBy: { createdAt: 'asc' } },
        assignments: { orderBy: { createdAt: 'desc' } },
      },
    });

    if (!raw) return null;

    return {
      ticket: this.toDomain(raw),
      notes: raw.notes.map((note) => ({
        id: note.id,
        content: note.content,
        authorId: note.authorId,
        isInternal: note.isInternal,
        createdAt: note.createdAt,
      })),
      assignments: raw.assignments.map((assignment) => ({
        id: assignment.id,
        assigneeId: assignment.assigneeId,
        assignedBy: assignment.assignedBy,
        dueDate: assignment.dueDate,
        isActive: assignment.isActive,
        createdAt: assignment.createdAt,
      })),
    };
  }
}

function dayBounds(date: Date) {
  const start = new Date(date);
  start.setHours(0, 0, 0, 0);
  const end = new Date(date);
  end.setHours(23, 59, 59, 999);
  return { start, end };
}
