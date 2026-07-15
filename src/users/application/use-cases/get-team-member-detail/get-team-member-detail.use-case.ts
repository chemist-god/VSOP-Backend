import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../../../prisma/prisma.service';
import { USER_REPOSITORY_PORT, UserRepositoryPort } from '@users/application/ports/user-repository.port';

@Injectable()
export class GetTeamMemberDetailUseCase {
  constructor(
    private readonly prisma: PrismaService,
    @Inject(USER_REPOSITORY_PORT) private readonly userRepo: UserRepositoryPort,
  ) {}

  async execute(userId: string) {
    const user = await this.userRepo.findById(userId);
    if (!user) {
      throw new NotFoundException({
        code: 'USER_NOT_FOUND',
        message: 'Team member not found.',
      });
    }

    const assignments = await this.prisma.assignment.findMany({
      where: { assigneeId: userId },
      orderBy: { createdAt: 'desc' },
      take: 40,
      include: {
        ticket: {
          select: {
            id: true,
            referenceId: true,
            status: true,
            severity: true,
            description: true,
            resolutionNote: true,
            portalId: true,
            createdAt: true,
            resolvedAt: true,
            portal: { select: { companyName: true, slug: true } },
          },
        },
      },
    });

    const activeAssignments = assignments.filter((row) => row.isActive);
    const resolvedCount = await this.prisma.ticket.count({
      where: {
        status: { in: ['RESOLVED', 'CLOSED'] },
        assignments: { some: { assigneeId: userId } },
      },
    });

    const overdueCount = activeAssignments.filter(
      (row) => row.dueDate.getTime() < Date.now(),
    ).length;

    const resolvedTickets = await this.prisma.ticket.findMany({
      where: {
        resolvedAt: { not: null },
        assignments: { some: { assigneeId: userId } },
      },
      select: { createdAt: true, resolvedAt: true },
      take: 50,
      orderBy: { resolvedAt: 'desc' },
    });

    let mttrHours: number | null = null;
    if (resolvedTickets.length > 0) {
      const totalMs = resolvedTickets.reduce((sum, ticket) => {
        if (!ticket.resolvedAt) return sum;
        return sum + (ticket.resolvedAt.getTime() - ticket.createdAt.getTime());
      }, 0);
      mttrHours = Math.round((totalMs / resolvedTickets.length / 3_600_000) * 10) / 10;
    }

    const ticketIds = assignments.map((row) => row.ticketId);
    const activity = await this.prisma.auditLog.findMany({
      where: {
        OR: [
          { actorId: userId },
          ...(ticketIds.length
            ? [
                {
                  ticketId: { in: ticketIds },
                  action: {
                    in: ['ticket.assigned', 'ticket.status_changed', 'ticket.resolved'],
                  },
                },
              ]
            : []),
        ],
      },
      orderBy: { createdAt: 'desc' },
      take: 40,
      include: {
        ticket: { select: { referenceId: true } },
      },
    });

    const notes = await this.prisma.ticketNote.findMany({
      where: { authorId: userId },
      orderBy: { createdAt: 'desc' },
      take: 20,
      include: {
        ticket: { select: { id: true, referenceId: true } },
      },
    });

    return {
      member: {
        id: user.id,
        name: user.name,
        email: user.email.value,
        role: user.role,
        isActive: user.isActive,
        createdAt: user.createdAt,
      },
      stats: {
        openAssignments: activeAssignments.length,
        resolvedCount,
        overdueCount,
        mttrHours,
      },
      assignments: assignments.map((row) => ({
        id: row.id,
        isActive: row.isActive,
        dueDate: row.dueDate,
        assignedAt: row.createdAt,
        ticket: {
          id: row.ticket.id,
          referenceId: row.ticket.referenceId,
          status: row.ticket.status,
          severity: row.ticket.severity,
          description: row.ticket.description,
          resolutionNote: row.ticket.resolutionNote,
          portalName: row.ticket.portal?.companyName ?? 'Internal',
          portalSlug: row.ticket.portal?.slug ?? 'internal',
          createdAt: row.ticket.createdAt,
          resolvedAt: row.ticket.resolvedAt,
        },
      })),
      activity: activity.map((row) => ({
        id: row.id,
        action: row.action,
        ticketId: row.ticketId,
        ticketReferenceId: row.ticket?.referenceId ?? null,
        beforeState: row.beforeState,
        afterState: row.afterState,
        createdAt: row.createdAt,
      })),
      notes: notes.map((note) => ({
        id: note.id,
        content: note.content,
        ticketId: note.ticket.id,
        ticketReferenceId: note.ticket.referenceId,
        createdAt: note.createdAt,
      })),
    };
  }
}
