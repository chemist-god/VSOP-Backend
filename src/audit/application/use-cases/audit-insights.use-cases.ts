import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../prisma/prisma.service';

@Injectable()
export class ListAuditLogsUseCase {
  constructor(private readonly prisma: PrismaService) {}

  async execute(input: { limit?: number; page?: number } = {}) {
    const take = Math.min(Math.max(input.limit ?? 20, 1), 100);
    const page = Math.max(input.page ?? 1, 1);
    const skip = (page - 1) * take;

    const [total, rows] = await Promise.all([
      this.prisma.auditLog.count(),
      this.prisma.auditLog.findMany({
        orderBy: { createdAt: 'desc' },
        skip,
        take,
        include: {
          ticket: { select: { referenceId: true, portalId: true } },
        },
      }),
    ]);

    const actorIds = [...new Set(rows.map((row) => row.actorId).filter(Boolean))] as string[];
    const actors = actorIds.length
      ? await this.prisma.user.findMany({
          where: { id: { in: actorIds } },
          select: { id: true, name: true, email: true, role: true },
        })
      : [];
    const actorsById = Object.fromEntries(actors.map((actor) => [actor.id, actor]));

    return {
      items: rows.map((row) => ({
        id: row.id,
        action: row.action,
        entityType: row.entityType,
        entityId: row.entityId,
        ticketId: row.ticketId,
        ticketReferenceId: row.ticket?.referenceId ?? null,
        actorType: row.actorType,
        actorId: row.actorId,
        actor: row.actorId ? actorsById[row.actorId] ?? null : null,
        beforeState: row.beforeState,
        afterState: row.afterState,
        createdAt: row.createdAt,
      })),
      page,
      pageSize: take,
      total,
      totalPages: Math.max(1, Math.ceil(total / take)),
    };
  }
}

@Injectable()
export class GetInsightsUseCase {
  constructor(private readonly prisma: PrismaService) {}

  async execute(daysInput?: number) {
    const allowed = [7, 14, 30] as const;
    const days = (allowed as readonly number[]).includes(Number(daysInput))
      ? Number(daysInput)
      : 14;
    const span = days - 1;

    const [byStatus, bySeverity, byPortal, recentResolved, total] = await Promise.all([
      this.prisma.ticket.groupBy({ by: ['status'], _count: { _all: true } }),
      this.prisma.ticket.groupBy({ by: ['severity'], _count: { _all: true } }),
      this.prisma.ticket.groupBy({
        by: ['portalId'],
        _count: { _all: true },
      }),
      this.prisma.ticket.count({
        where: {
          resolvedAt: { gte: new Date(Date.now() - 7 * 24 * 3_600_000) },
        },
      }),
      this.prisma.ticket.count(),
    ]);

    const portalIds = byPortal
      .sort((a, b) => b._count._all - a._count._all)
      .slice(0, 8)
      .map((row) => row.portalId)
      .filter((id): id is string => Boolean(id));
    const topPortals = byPortal
      .filter((row) => row.portalId != null)
      .sort((a, b) => b._count._all - a._count._all)
      .slice(0, 8);
    const portals = portalIds.length
      ? await this.prisma.portal.findMany({
          where: { id: { in: portalIds } },
          select: { id: true, slug: true, companyName: true },
        })
      : [];
    const portalsById = Object.fromEntries(portals.map((portal) => [portal.id, portal]));

    const since = new Date(Date.now() - span * 24 * 3_600_000);
    const tickets = await this.prisma.ticket.findMany({
      where: { createdAt: { gte: since } },
      select: { createdAt: true, status: true },
    });

    const dayKey = (date: Date) => date.toISOString().slice(0, 10);
    const trendMap = new Map<string, { created: number; resolved: number }>();
    for (let i = span; i >= 0; i -= 1) {
      const d = new Date();
      d.setHours(0, 0, 0, 0);
      d.setDate(d.getDate() - i);
      trendMap.set(dayKey(d), { created: 0, resolved: 0 });
    }
    for (const ticket of tickets) {
      const key = dayKey(ticket.createdAt);
      const bucket = trendMap.get(key);
      if (bucket) bucket.created += 1;
    }

    const resolvedRecent = await this.prisma.ticket.findMany({
      where: { resolvedAt: { gte: since } },
      select: { resolvedAt: true },
    });
    for (const ticket of resolvedRecent) {
      if (!ticket.resolvedAt) continue;
      const key = dayKey(ticket.resolvedAt);
      const bucket = trendMap.get(key);
      if (bucket) bucket.resolved += 1;
    }

    const team = await this.buildTeamInsights(since, span);

    return {
      totals: {
        tickets: total,
        resolvedLast7Days: recentResolved,
        open: byStatus.find((row) => row.status === 'OPEN')?._count._all ?? 0,
        inProgress: byStatus.find((row) => row.status === 'IN_PROGRESS')?._count._all ?? 0,
        resolved: byStatus.find((row) => row.status === 'RESOLVED')?._count._all ?? 0,
        closed: byStatus.find((row) => row.status === 'CLOSED')?._count._all ?? 0,
      },
      byStatus: byStatus.map((row) => ({
        status: row.status,
        count: row._count._all,
      })),
      bySeverity: bySeverity.map((row) => ({
        severity: row.severity,
        count: row._count._all,
      })),
      byPortal: topPortals.map((row) => ({
        portalId: row.portalId as string,
        companyName: portalsById[row.portalId as string]?.companyName ?? 'Unknown',
        slug: portalsById[row.portalId as string]?.slug ?? 'unknown',
        count: row._count._all,
      })),
      trendDays: days,
      trend: [...trendMap.entries()].map(([date, counts]) => ({
        date,
        ...counts,
      })),
      team,
    };
  }

  private async buildTeamInsights(since: Date, span: number) {
    const openStatuses = ['OPEN', 'IN_PROGRESS'] as const;
    const nowMs = Date.now();

    const [users, activeAssignments, resolvedAssigned] = await Promise.all([
      this.prisma.user.findMany({
        select: {
          id: true,
          name: true,
          email: true,
          role: true,
          isActive: true,
        },
        orderBy: { name: 'asc' },
      }),
      this.prisma.assignment.findMany({
        where: { isActive: true },
        select: {
          assigneeId: true,
          dueDate: true,
          ticket: { select: { status: true } },
        },
      }),
      this.prisma.ticket.findMany({
        where: {
          resolvedAt: { gte: since },
          assignments: { some: {} },
        },
        select: {
          createdAt: true,
          resolvedAt: true,
          assignments: { select: { assigneeId: true } },
        },
      }),
    ]);

    type MemberAgg = {
      openAssigned: number;
      resolvedInRange: number;
      overdue: number;
      mttrTotalMs: number;
      mttrCount: number;
    };

    const byUser = new Map<string, MemberAgg>();
    for (const user of users) {
      byUser.set(user.id, {
        openAssigned: 0,
        resolvedInRange: 0,
        overdue: 0,
        mttrTotalMs: 0,
        mttrCount: 0,
      });
    }

    for (const row of activeAssignments) {
      const agg = byUser.get(row.assigneeId);
      if (!agg) continue;
      const isOpenWork = (openStatuses as readonly string[]).includes(row.ticket.status);
      if (!isOpenWork) continue;
      agg.openAssigned += 1;
      if (row.dueDate.getTime() < nowMs) agg.overdue += 1;
    }

    const dayKey = (date: Date) => date.toISOString().slice(0, 10);
    const teamTrendMap = new Map<string, number>();
    for (let i = span; i >= 0; i -= 1) {
      const d = new Date();
      d.setHours(0, 0, 0, 0);
      d.setDate(d.getDate() - i);
      teamTrendMap.set(dayKey(d), 0);
    }

    let teamMttrTotalMs = 0;
    let teamMttrCount = 0;

    for (const ticket of resolvedAssigned) {
      if (!ticket.resolvedAt) continue;
      const key = dayKey(ticket.resolvedAt);
      if (teamTrendMap.has(key)) {
        teamTrendMap.set(key, (teamTrendMap.get(key) ?? 0) + 1);
      }

      const durationMs = ticket.resolvedAt.getTime() - ticket.createdAt.getTime();
      if (durationMs >= 0) {
        teamMttrTotalMs += durationMs;
        teamMttrCount += 1;
      }

      const assigneeIds = [...new Set(ticket.assignments.map((a) => a.assigneeId))];
      for (const assigneeId of assigneeIds) {
        let agg = byUser.get(assigneeId);
        if (!agg) {
          agg = {
            openAssigned: 0,
            resolvedInRange: 0,
            overdue: 0,
            mttrTotalMs: 0,
            mttrCount: 0,
          };
          byUser.set(assigneeId, agg);
        }
        agg.resolvedInRange += 1;
        if (durationMs >= 0) {
          agg.mttrTotalMs += durationMs;
          agg.mttrCount += 1;
        }
      }
    }

    const usersById = new Map(users.map((user) => [user.id, user]));
    const byMember = [...byUser.entries()]
      .map(([userId, agg]) => {
        const user = usersById.get(userId);
        if (!user) return null;
        const hasSignal =
          user.isActive ||
          agg.openAssigned > 0 ||
          agg.resolvedInRange > 0 ||
          agg.overdue > 0;
        if (!hasSignal) return null;
        return {
          userId,
          name: user.name,
          email: user.email,
          role: user.role,
          isActive: user.isActive,
          openAssigned: agg.openAssigned,
          resolvedInRange: agg.resolvedInRange,
          overdue: agg.overdue,
          mttrHours:
            agg.mttrCount > 0
              ? Math.round((agg.mttrTotalMs / agg.mttrCount / 3_600_000) * 10) / 10
              : null,
        };
      })
      .filter((row): row is NonNullable<typeof row> => row != null)
      .sort((a, b) => {
        if (b.resolvedInRange !== a.resolvedInRange) {
          return b.resolvedInRange - a.resolvedInRange;
        }
        if (b.openAssigned !== a.openAssigned) {
          return b.openAssigned - a.openAssigned;
        }
        return a.name.localeCompare(b.name);
      });

    const openAssigned = byMember.reduce((sum, row) => sum + row.openAssigned, 0);
    const overdue = byMember.reduce((sum, row) => sum + row.overdue, 0);

    return {
      kpis: {
        openAssigned,
        resolvedInRange: resolvedAssigned.length,
        overdue,
        avgMttrHours:
          teamMttrCount > 0
            ? Math.round((teamMttrTotalMs / teamMttrCount / 3_600_000) * 10) / 10
            : null,
      },
      trend: [...teamTrendMap.entries()].map(([date, resolved]) => ({
        date,
        resolved,
      })),
      byMember,
    };
  }
}
