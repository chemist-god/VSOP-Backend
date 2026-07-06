export const NOTIFICATION_PORT = Symbol('NotificationPort');

export interface AssignmentNotificationPayload {
  assigneeName: string;
  assigneeEmail: string;
  ticketReferenceId: string;
  portalName: string;
  issueDescription: string;
  dueDate: Date;
  dashboardUrl: string;
}

export interface ResolutionNotificationPayload {
  clientAdminEmail: string;
  portalName: string;
  ticketReferenceId: string;
  originalDescription: string;
  resolutionNote: string;
  resolvedAt: Date;
}

export interface InviteNotificationPayload {
  inviteeName: string;
  inviteeEmail: string;
  inviterName: string;
  role: string;
  acceptUrl: string;
  expiresAt: Date;
}

export interface NotificationPort {
  sendAssignmentNotification(payload: AssignmentNotificationPayload): Promise<void>;
  sendResolutionNotification(payload: ResolutionNotificationPayload): Promise<void>;
  sendInviteNotification(payload: InviteNotificationPayload): Promise<void>;
}
