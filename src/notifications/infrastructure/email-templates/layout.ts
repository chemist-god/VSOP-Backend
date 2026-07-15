import { escapeHtml } from './html';

/** Brand blue from VSOP mark */
const BRAND_BLUE = '#1f96fc';
const INK = '#1c1d21';
const MUTED = '#6b7280';
const SOFT_BG = '#f4f5f7';
const CARD = '#ffffff';
const RULE = '#e8eaee';

export type EmailBrandAssets = {
  /** Black wordmark for light canvases */
  logoLightUrl: string;
  /** White wordmark for dark-mode / inverted clients */
  logoDarkUrl: string;
};

export type EmailShellOptions = {
  /** Absolute frontend origin, e.g. https://support.veritrack.cloud */
  frontendUrl: string;
  brand: EmailBrandAssets;
  previewText?: string;
  title: string;
  bodyHtml: string;
  footerNote?: string;
};

function logoImg(src: string, className: string, display: 'block' | 'none'): string {
  return `<img
    class="${className}"
    src="${escapeHtml(src)}"
    alt="VSOP"
    width="140"
    height="75"
    style="display:${display};width:140px;max-width:42%;height:auto;border:0;outline:none;"
  />`;
}

/**
 * Soft, airy email shell — dual logos for light/dark clients, quiet footer.
 * Table-based for client compatibility; intentional whitespace over dense SaaS chrome.
 */
export function renderEmailShell(options: EmailShellOptions): string {
  const base = options.frontendUrl.replace(/\/$/, '');
  const { logoLightUrl, logoDarkUrl } = options.brand;
  const preview = options.previewText
    ? `<div style="display:none;max-height:0;overflow:hidden;opacity:0;color:transparent;">
        ${escapeHtml(options.previewText)}
      </div>`
    : '';
  const footerNote =
    options.footerNote ??
    'VeriTrack Support Operations · Internal help desk for client portals';

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <meta name="color-scheme" content="light dark" />
  <meta name="supported-color-schemes" content="light dark" />
  <title>${escapeHtml(options.title)}</title>
  <style>
    :root { color-scheme: light dark; }
    .vsop-logo-dark { display: none !important; max-height: 0 !important; overflow: hidden !important; }
    @media (prefers-color-scheme: dark) {
      .vsop-logo-light { display: none !important; max-height: 0 !important; overflow: hidden !important; }
      .vsop-logo-dark { display: block !important; max-height: none !important; overflow: visible !important; }
    }
  </style>
  <!--[if mso]>
  <style type="text/css">
    .vsop-logo-dark { display: none !important; }
    .vsop-logo-light { display: block !important; }
  </style>
  <![endif]-->
</head>
<body style="margin:0;padding:0;background:${SOFT_BG};">
  ${preview}
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:${SOFT_BG};padding:32px 16px;">
    <tr>
      <td align="center">
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:560px;margin:0 auto;">
          <tr>
            <td style="padding:0 4px 22px 4px;">
              <a href="${escapeHtml(base)}" style="text-decoration:none;">
                ${logoImg(logoLightUrl, 'vsop-logo-light', 'block')}
                ${logoImg(logoDarkUrl, 'vsop-logo-dark', 'none')}
              </a>
            </td>
          </tr>
          <tr>
            <td style="background:${CARD};border-radius:16px;padding:36px 32px 32px;box-shadow:0 1px 2px rgba(16,24,40,0.04);">
              ${options.bodyHtml}
            </td>
          </tr>
          <tr>
            <td style="padding:24px 8px 8px;text-align:center;">
              <p style="margin:0;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;font-size:12px;line-height:1.5;color:${MUTED};">
                ${escapeHtml(footerNote)}
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}

export function heading(text: string): string {
  return `<h1 style="margin:0 0 12px;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;font-size:22px;font-weight:600;letter-spacing:-0.02em;line-height:1.3;color:${INK};">
    ${escapeHtml(text)}
  </h1>`;
}

export function paragraph(text: string, opts?: { muted?: boolean }): string {
  const color = opts?.muted ? MUTED : INK;
  return `<p style="margin:0 0 16px;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;font-size:15px;line-height:1.6;color:${color};">
    ${text}
  </p>`;
}

export function detailBlock(
  rows: Array<{ label: string; value: string }>,
): string {
  const items = rows
    .map(
      (row, i) => `
      <tr>
        <td style="padding:${i === 0 ? '14px' : '12px'} 16px ${i === rows.length - 1 ? '14px' : '12px'};${i < rows.length - 1 ? `border-bottom:1px solid ${RULE};` : ''}vertical-align:top;">
          <div style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;font-size:11px;font-weight:600;letter-spacing:0.06em;text-transform:uppercase;color:${MUTED};margin:0 0 4px;">
            ${escapeHtml(row.label)}
          </div>
          <div style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;font-size:14px;line-height:1.5;color:${INK};word-break:break-word;">
            ${row.value}
          </div>
        </td>
      </tr>`,
    )
    .join('');

  return `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin:8px 0 24px;background:${SOFT_BG};border-radius:12px;overflow:hidden;">
    ${items}
  </table>`;
}

export function primaryButton(label: string, href: string): string {
  return `<table role="presentation" cellpadding="0" cellspacing="0" style="margin:8px 0 24px;">
    <tr>
      <td style="border-radius:10px;background:${BRAND_BLUE};">
        <a href="${escapeHtml(href)}"
           style="display:inline-block;padding:13px 22px;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;font-size:14px;font-weight:600;color:#ffffff;text-decoration:none;border-radius:10px;">
          ${escapeHtml(label)}
        </a>
      </td>
    </tr>
  </table>`;
}

export function quietNote(text: string): string {
  return `<p style="margin:0;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;font-size:13px;line-height:1.55;color:${MUTED};">
    ${text}
  </p>`;
}
