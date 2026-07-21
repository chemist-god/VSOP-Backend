import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Resend } from 'resend';
import {
  NotificationPort,
  AssignmentNotificationPayload,
  ResolutionNotificationPayload,
  InviteNotificationPayload,
  TicketCreatedNotificationPayload,
} from '@notifications/application/ports/notification.port';
import {
  EmailRenderContext,
  renderAssignmentEmail,
  renderInviteEmail,
  renderResolutionEmail,
  renderTicketCreatedEmail,
} from './email-templates';

@Injectable()
export class ResendNotificationAdapter implements NotificationPort {
  private readonly resend: Resend | null;
  private readonly fromEmail: string;
  private readonly emailCtx: EmailRenderContext;
  private readonly logger = new Logger(ResendNotificationAdapter.name);

  constructor(private readonly config: ConfigService) {
    const apiKey = config.get<string>('resend.apiKey');
    this.resend = apiKey ? new Resend(apiKey) : null;
    this.fromEmail =
      config.get<string>('resend.fromEmail') ?? 'support@veritrack.cloud';

    this.emailCtx = {
      frontendUrl:
        config.get<string>('appUrls.frontendUrl') ?? 'http://localhost:3000',
      brand: {
        logoLightUrl:
          config.get<string>('email.logoLightUrl') ??
          'https://res.cloudinary.com/efvls9rz/image/upload/f_auto,q_auto,w_280/v1784112481/vsop-logo-black_nztpbp.webp',
        logoDarkUrl:
          config.get<string>('email.logoDarkUrl') ??
          'https://res.cloudinary.com/efvls9rz/image/upload/f_auto,q_auto,w_280/v1784112447/vsop-logo-light-1_pesrls.webp',
      },
    };

    if (!this.resend) {
      this.logger.warn('RESEND_API_KEY is not set — email notifications are disabled');
    }
  }

  async sendAssignmentNotification(
    payload: AssignmentNotificationPayload,
  ): Promise<void> {
    if (!this.resend) {
      this.logger.debug(
        `Skipped assignment email for ${payload.ticketReferenceId} (no Resend key)`,
      );
      return;
    }

    const email = renderAssignmentEmail(payload, this.emailCtx);

    try {
      await this.resend.emails.send({
        from: this.fromEmail,
        to: payload.assigneeEmail,
        subject: email.subject,
        html: email.html,
      });
    } catch (err) {
      this.logger.error('Failed to send assignment notification', err);
    }
  }

  async sendResolutionNotification(
    payload: ResolutionNotificationPayload,
  ): Promise<void> {
    if (!this.resend) {
      this.logger.debug(
        `Skipped resolution email for ${payload.ticketReferenceId} (no Resend key)`,
      );
      return;
    }

    const email = renderResolutionEmail(payload, this.emailCtx);

    try {
      await this.resend.emails.send({
        from: this.fromEmail,
        to: payload.clientAdminEmail,
        subject: email.subject,
        html: email.html,
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

    const email = renderInviteEmail(payload, this.emailCtx);

    try {
      await this.resend.emails.send({
        from: this.fromEmail,
        to: payload.inviteeEmail,
        subject: email.subject,
        html: email.html,
      });
    } catch (err) {
      this.logger.error('Failed to send invite notification', err);
      throw err;
    }
  }

  async sendTicketCreatedNotification(
    payload: TicketCreatedNotificationPayload,
  ): Promise<void> {
    if (!this.resend) {
      this.logger.debug(
        `Skipped ticket-created email for ${payload.ticketReferenceId} (no Resend key)`,
      );
      return;
    }

    const email = renderTicketCreatedEmail(payload, this.emailCtx);

    try {
      await this.resend.emails.send({
        from: this.fromEmail,
        to: payload.recipientEmail,
        subject: email.subject,
        html: email.html,
      });
    } catch (err) {
      this.logger.error('Failed to send ticket-created notification', err);
      throw err;
    }
  }
}
