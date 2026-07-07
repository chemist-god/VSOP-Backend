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

  async execute() {
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
      .map((row) => row.portalId);
    const topPortals = byPortal
      .sort((a, b) => b._count._all - a._count._all)
      .slice(0, 8);
    const portals = portalIds.length
      ? await this.prisma.portal.findMany({
          where: { id: { in: portalIds } },
          select: { id: true, slug: true, companyName: true },
        })
      : [];
    const portalsById = Object.fromEntries(portals.map((portal) => [portal.id, portal]));

    const since = new Date(Date.now() - 13 * 24 * 3_600_000);
    const tickets = await this.prisma.ticket.findMany({
      where: { createdAt: { gte: since } },
      select: { createdAt: true, status: true },
    });

    const dayKey = (date: Date) => date.toISOString().slice(0, 10);
    const trendMap = new Map<string, { created: number; resolved: number }>();
    for (let i = 13; i >= 0; i -= 1) {
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
        portalId: row.portalId,
        companyName: portalsById[row.portalId]?.companyName ?? 'Unknown',
        slug: portalsById[row.portalId]?.slug ?? 'unknown',
        count: row._count._all,
      })),
      trend: [...trendMap.entries()].map(([date, counts]) => ({
        date,
        ...counts,
      })),
    };
  }
}
