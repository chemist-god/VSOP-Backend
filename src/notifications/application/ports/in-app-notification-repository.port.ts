export const IN_APP_NOTIFICATION_REPOSITORY_PORT = Symbol(
  'InAppNotificationRepositoryPort',
);

export type InAppNotificationRecord = {
  id: string;
  userId: string;
  type: string;
  title: string;
  body: string;
  ticketId: string | null;
  readAt: Date | null;
  createdAt: Date;
};

export type CreateInAppNotificationInput = {
  id: string;
  userId: string;
  type: 'TICKET_CREATED' | 'TICKET_ASSIGNED' | 'TICKET_RESOLVED';
  title: string;
  body: string;
  ticketId?: string | null;
};

export interface InAppNotificationRepositoryPort {
  createMany(items: CreateInAppNotificationInput[]): Promise<void>;
  findByUserId(userId: string): Promise<InAppNotificationRecord[]>;
  markRead(id: string, userId: string): Promise<InAppNotificationRecord | null>;
  markAllRead(userId: string): Promise<number>;
  countUnread(userId: string): Promise<number>;
}
