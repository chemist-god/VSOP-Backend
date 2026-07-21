import {
  InviteNotificationPayload,
  AssignmentNotificationPayload,
  ResolutionNotificationPayload,
  TicketCreatedNotificationPayload,
} from '@notifications/application/ports/notification.port';
import { escapeHtml, formatDate, formatDateTime } from './html';
import {
  detailBlock,
  EmailBrandAssets,
  heading,
  paragraph,
  primaryButton,
  quietNote,
  renderEmailShell,
} from './layout';

export type EmailRenderContext = {
  frontendUrl: string;
  brand: EmailBrandAssets;
};

export function renderInviteEmail(
  payload: InviteNotificationPayload,
  ctx: EmailRenderContext,
): { subject: string; html: string } {
  const roleLabel = payload.role.replace(/_/g, ' ').toLowerCase();
  const body = [
    heading("You're invited to VSOP"),
    paragraph(`Hi ${escapeHtml(payload.inviteeName)},`),
    paragraph(
      `<strong style="font-weight:600;">${escapeHtml(payload.inviterName)}</strong> invited you to join VeriTrack Support Operations as a <strong style="font-weight:600;">${escapeHtml(roleLabel)}</strong>.`,
    ),
    paragraph(
      'Accept the invite to set your password and get started. The link is personal to you and expires in 48 hours.',
      { muted: true },
    ),
    primaryButton('Accept invitation', payload.acceptUrl),
    quietNote(
      `Link expires ${escapeHtml(formatDateTime(payload.expiresAt))}. If you weren’t expecting this, you can ignore the email.`,
    ),
  ].join('');

  return {
    subject: "You're invited to VeriTrack VSOP",
    html: renderEmailShell({
      frontendUrl: ctx.frontendUrl,
      brand: ctx.brand,
      title: "You're invited to VSOP",
      previewText: `${payload.inviterName} invited you to join VSOP`,
      bodyHtml: body,
      footerNote: 'VeriTrack Support Operations',
    }),
  };
}

export function renderAssignmentEmail(
  payload: AssignmentNotificationPayload,
  ctx: EmailRenderContext,
): { subject: string; html: string } {
  const body = [
    heading('A ticket is waiting for you'),
    paragraph(`Hi ${escapeHtml(payload.assigneeName)},`),
    paragraph(
      'You’ve been assigned a support ticket. Here’s a quick look — open it in VSOP when you’re ready.',
    ),
    detailBlock([
      {
        label: 'Reference',
        value: escapeHtml(payload.ticketReferenceId),
      },
      {
        label: 'Portal',
        value: escapeHtml(payload.portalName),
      },
      {
        label: 'Due by',
        value: escapeHtml(formatDate(payload.dueDate)),
      },
      {
        label: 'Issue',
        value: escapeHtml(payload.issueDescription),
      },
    ]),
    primaryButton('Open ticket', payload.dashboardUrl),
    quietNote('Reply in the dashboard — clients don’t see this thread.'),
  ].join('');

  return {
    subject: `[${payload.ticketReferenceId}] Assigned to you`,
    html: renderEmailShell({
      frontendUrl: ctx.frontendUrl,
      brand: ctx.brand,
      title: 'Ticket assigned',
      previewText: `${payload.ticketReferenceId} · ${payload.portalName}`,
      bodyHtml: body,
    }),
  };
}

export function renderTicketCreatedEmail(
  payload: TicketCreatedNotificationPayload,
  ctx: EmailRenderContext,
): { subject: string; html: string } {
  const isIntake = payload.source === 'INTAKE';
  const sourceLabel = isIntake ? 'Portal intake' : 'Internal';
  const intro = isIntake
    ? 'A client just submitted a support report. Open it in VSOP when you’re ready to triage.'
    : payload.createdByName
      ? `<strong style="font-weight:600;">${escapeHtml(payload.createdByName)}</strong> filed an internal ticket. Here’s a quick look.`
      : 'An internal ticket was filed in VSOP. Here’s a quick look.';

  const body = [
    heading(isIntake ? 'New portal report' : 'Internal ticket created'),
    paragraph(`Hi ${escapeHtml(payload.recipientName)},`),
    paragraph(intro),
    detailBlock([
      {
        label: 'Reference',
        value: escapeHtml(payload.ticketReferenceId),
      },
      {
        label: 'Source',
        value: escapeHtml(sourceLabel),
      },
      {
        label: 'Portal',
        value: escapeHtml(payload.portalName),
      },
      {
        label: 'Issue',
        value: escapeHtml(payload.issueDescription),
      },
    ]),
    primaryButton('Open ticket', payload.dashboardUrl),
    quietNote(
      isIntake
        ? 'Assign this ticket from the inbox so the right developer can pick it up.'
        : 'Internal tickets stay inside VSOP — clients are not notified.',
    ),
  ].join('');

  return {
    subject: isIntake
      ? `[${payload.ticketReferenceId}] New portal report`
      : `[${payload.ticketReferenceId}] Internal ticket created`,
    html: renderEmailShell({
      frontendUrl: ctx.frontendUrl,
      brand: ctx.brand,
      title: isIntake ? 'New portal report' : 'Internal ticket created',
      previewText: `${payload.ticketReferenceId} · ${payload.portalName}`,
      bodyHtml: body,
    }),
  };
}

export function renderResolutionEmail(
  payload: ResolutionNotificationPayload,
  ctx: EmailRenderContext,
): { subject: string; html: string } {
  const body = [
    heading('Your issue has been resolved'),
    paragraph(`Hello ${escapeHtml(payload.portalName)} team,`),
    paragraph(
      'We’ve wrapped up the issue you reported through VeriTrack support. Here’s a short summary of what changed.',
    ),
    detailBlock([
      {
        label: 'Reference',
        value: escapeHtml(payload.ticketReferenceId),
      },
      {
        label: 'What you reported',
        value: escapeHtml(payload.originalDescription),
      },
      {
        label: 'What we did',
        value: escapeHtml(payload.resolutionNote),
      },
      {
        label: 'Resolved',
        value: escapeHtml(formatDateTime(payload.resolvedAt)),
      },
    ]),
    paragraph(
      'Please refresh your portal and try the flow again. If anything still looks off, send another report — we’ll pick it up.',
    ),
    quietNote('This message was sent by the VeriTrack support team.'),
  ].join('');

  return {
    subject: `[${payload.ticketReferenceId}] Your issue has been resolved`,
    html: renderEmailShell({
      frontendUrl: ctx.frontendUrl,
      brand: ctx.brand,
      title: 'Issue resolved',
      previewText: `Reference ${payload.ticketReferenceId} is resolved`,
      bodyHtml: body,
      footerNote: 'VeriTrack Support Team',
    }),
  };
}
