import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Resend } from 'resend';
import {
  NotificationPort,
  AssignmentNotificationPayload,
  ResolutionNotificationPayload,
  InviteNotificationPayload,
} from '@notifications/application/ports/notification.port';

@Injectable()
export class ResendNotificationAdapter implements NotificationPort {
  private readonly resend: Resend | null;
  private readonly fromEmail: string;
  private readonly logger = new Logger(ResendNotificationAdapter.name);

  constructor(private readonly config: ConfigService) {
    const apiKey = config.get<string>('resend.apiKey');
    this.resend = apiKey ? new Resend(apiKey) : null;
    this.fromEmail = config.get<string>('resend.fromEmail') ?? 'support@veritrack.cloud';

    if (!this.resend) {
      this.logger.warn('RESEND_API_KEY is not set — email notifications are disabled');
    }
  }

  async sendAssignmentNotification(payload: AssignmentNotificationPayload): Promise<void> {
    if (!this.resend) {
      this.logger.debug(`Skipped assignment email for ${payload.ticketReferenceId} (no Resend key)`);
      return;
    }

    try {
      await this.resend.emails.send({
        from: this.fromEmail,
        to: payload.assigneeEmail,
        subject: `[${payload.ticketReferenceId}] New ticket assigned to you`,
        html: `
          <h2>You have been assigned a support ticket</h2>
          <p><strong>Reference:</strong> ${payload.ticketReferenceId}</p>
          <p><strong>Portal:</strong> ${payload.portalName}</p>
          <p><strong>Issue:</strong> ${payload.issueDescription}</p>
          <p><strong>Due by:</strong> ${payload.dueDate.toDateString()}</p>
          <p><a href="${payload.dashboardUrl}">View ticket in VSOP Dashboard</a></p>
          <hr/>
          <small>VeriTrack Support Operations</small>
        `,
      });
    } catch (err) {
      this.logger.error('Failed to send assignment notification', err);
    }
  }

  async sendResolutionNotification(payload: ResolutionNotificationPayload): Promise<void> {
    if (!this.resend) {
      this.logger.debug(`Skipped resolution email for ${payload.ticketReferenceId} (no Resend key)`);
      return;
    }

    try {
      await this.resend.emails.send({
        from: this.fromEmail,
        to: payload.clientAdminEmail,
        subject: `[${payload.ticketReferenceId}] Your reported issue has been resolved`,
        html: `
          <h2>Your issue has been resolved</h2>
          <p>Dear ${payload.portalName} Admin,</p>
          <p>We have resolved the issue you reported.</p>
          <p><strong>Reference:</strong> ${payload.ticketReferenceId}</p>
          <p><strong>Original issue:</strong> ${payload.originalDescription}</p>
          <p><strong>What we did:</strong> ${payload.resolutionNote}</p>
          <p><strong>Resolved at:</strong> ${payload.resolvedAt.toLocaleString()}</p>
          <p>Please refresh your portal and try again. If the issue persists, submit a new report.</p>
          <hr/>
          <small>VeriTrack Support Team</small>
        `,
      });
    } catch (err) {
      this.logger.error('Failed to send resolution notification', err);
    }
  }

  async sendInviteNotification(payload: InviteNotificationPayload): Promise<void> {
    if (!this.resend) {
      this.logger.warn(
        `RESEND disabled — invite link for ${payload.inviteeEmail}: ${payload.acceptUrl}`,
      );
      return;
    }

    try {
      await this.resend.emails.send({
        from: this.fromEmail,
        to: payload.inviteeEmail,
        subject: `You're invited to VeriTrack VSOP`,
        html: `
          <div style="font-family: system-ui, sans-serif; max-width: 520px; margin: 0 auto;">
            <h2 style="margin-bottom: 8px;">Join VeriTrack Support Operations</h2>
            <p>Hi ${payload.inviteeName},</p>
            <p><strong>${payload.inviterName}</strong> invited you to VSOP as a <strong>${payload.role}</strong>.</p>
            <p>Click below to accept and create your own password. This link expires in 48 hours (${payload.expiresAt.toUTCString()}).</p>
            <p style="margin: 28px 0;">
              <a href="${payload.acceptUrl}"
                 style="background:#4f46e5;color:#fff;padding:12px 20px;border-radius:8px;text-decoration:none;font-weight:600;">
                Accept invitation
              </a>
            </p>
            <p style="color:#666;font-size:13px;">If you did not expect this email, you can ignore it.</p>
            <hr/>
            <small>VeriTrack Support Operations</small>
          </div>
        `,
      });
    } catch (err) {
      this.logger.error('Failed to send invite notification', err);
      throw err;
    }
  }
}
