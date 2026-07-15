import { Injectable } from '@nestjs/common';
import { InAppNotificationType } from '@prisma/client';
import { PrismaService } from '../../../prisma/prisma.service';
import {
  CreateInAppNotificationInput,
  InAppNotificationRecord,
  InAppNotificationRepositoryPort,
} from '@notifications/application/ports/in-app-notification-repository.port';

@Injectable()
export class PrismaInAppNotificationRepository
  implements InAppNotificationRepositoryPort
{
  constructor(private readonly prisma: PrismaService) {}

  async createMany(items: CreateInAppNotificationInput[]): Promise<void> {
    if (items.length === 0) return;
    await this.prisma.inAppNotification.createMany({
      data: items.map((item) => ({
        id: item.id,
        userId: item.userId,
        type: item.type as InAppNotificationType,
        title: item.title,
        body: item.body,
        ticketId: item.ticketId ?? null,
      })),
    });
  }

  async findByUserId(userId: string): Promise<InAppNotificationRecord[]> {
    const rows = await this.prisma.inAppNotification.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      take: 100,
    });
    return rows.map(toRecord);
  }

  async markRead(
    id: string,
    userId: string,
  ): Promise<InAppNotificationRecord | null> {
    const existing = await this.prisma.inAppNotification.findFirst({
      where: { id, userId },
    });
    if (!existing) return null;

    const row = await this.prisma.inAppNotification.update({
      where: { id },
      data: { readAt: new Date() },
    });
    return toRecord(row);
  }

  async markAllRead(userId: string): Promise<number> {
    const result = await this.prisma.inAppNotification.updateMany({
      where: { userId, readAt: null },
      data: { readAt: new Date() },
    });
    return result.count;
  }

  async countUnread(userId: string): Promise<number> {
    return this.prisma.inAppNotification.count({
      where: { userId, readAt: null },
    });
  }
}

function toRecord(row: {
  id: string;
  userId: string;
  type: InAppNotificationType;
  title: string;
  body: string;
  ticketId: string | null;
  readAt: Date | null;
  createdAt: Date;
}): InAppNotificationRecord {
  return {
    id: row.id,
    userId: row.userId,
    type: row.type,
    title: row.title,
    body: row.body,
    ticketId: row.ticketId,
    readAt: row.readAt,
    createdAt: row.createdAt,
  };
}
