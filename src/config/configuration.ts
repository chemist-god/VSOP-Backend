const parseCsv = (value: string | undefined, fallback: string[]): string[] =>
  (value ?? '').split(',').map((item) => item.trim()).filter(Boolean).length > 0
    ? (value ?? '').split(',').map((item) => item.trim()).filter(Boolean)
    : fallback;

const parseBoolean = (value: string | undefined, fallback: boolean): boolean => {
  if (value === undefined || value.trim() === '') {
    return fallback;
  }
  return ['1', 'true', 'yes', 'on'].includes(value.trim().toLowerCase());
};

const stripTrailingSlash = (url: string): string => url.replace(/\/$/, '');

const isLocalhostUrl = (url: string): boolean => {
  try {
    const host = new URL(url).hostname;
    return host === 'localhost' || host === '127.0.0.1' || host === '::1';
  } catch {
    return /localhost|127\.0\.0\.1/i.test(url);
  }
};

/**
 * Single public frontend origin for email CTAs (invite accept, open ticket, logo links).
 * Priority: PUBLIC_APP_URL → env-aware pick from FRONTEND_URL list → localhost.
 * Never returns a comma-joined string.
 */
const resolvePublicFrontendUrl = (nodeEnv: string): string => {
  const explicit = process.env.PUBLIC_APP_URL?.trim();
  if (explicit) {
    return stripTrailingSlash(explicit.split(',')[0]!.trim());
  }

  const candidates = parseCsv(process.env.FRONTEND_URL, [
    'http://localhost:3000',
  ]);

  if (nodeEnv === 'production') {
    const remote =
      candidates.find((url) => !isLocalhostUrl(url)) ?? candidates[0]!;
    return stripTrailingSlash(remote);
  }

  const local =
    candidates.find((url) => isLocalhostUrl(url)) ?? candidates[0]!;
  return stripTrailingSlash(local);
};

export const configuration = () => {
  const nodeEnv = process.env.NODE_ENV ?? 'development';
  const frontendUrl = resolvePublicFrontendUrl(nodeEnv);

  return {
    app: {
      nodeEnv,
      port: parseInt(process.env.PORT ?? '3001', 10),
      // Default on in non-production; override with ENABLE_SWAGGER=true|false
      enableSwagger: parseBoolean(
        process.env.ENABLE_SWAGGER,
        nodeEnv !== 'production',
      ),
    },
    database: {
      url: process.env.DATABASE_URL,
    },
    security: {
      vsopServiceKey: process.env.VSOP_SERVICE_KEY,
      bcryptRounds: parseInt(process.env.BCRYPT_ROUNDS ?? '12', 10),
      corsOrigins: parseCsv(process.env.CORS_ORIGINS, [frontendUrl]),
    },
    jwt: {
      secret: process.env.JWT_SECRET,
      expiresIn: process.env.JWT_EXPIRES_IN ?? '8h',
      refreshSecret: process.env.JWT_REFRESH_SECRET,
      refreshExpiresIn: process.env.JWT_REFRESH_EXPIRES_IN ?? '7d',
    },
    cloudinary: {
      cloudName: process.env.CLOUDINARY_CLOUD_NAME,
      apiKey: process.env.CLOUDINARY_API_KEY,
      apiSecret: process.env.CLOUDINARY_API_SECRET,
    },
    resend: {
      apiKey: process.env.RESEND_API_KEY,
      fromEmail: process.env.RESEND_FROM_EMAIL,
    },
    email: {
      /** Black wordmark — for light email canvases */
      logoLightUrl:
        process.env.VSOP_EMAIL_LOGO_LIGHT_URL ??
        'https://res.cloudinary.com/efvls9rz/image/upload/f_auto,q_auto,w_280/v1784112481/vsop-logo-black_nztpbp.webp',
      /** White wordmark — for dark-mode / inverted email clients */
      logoDarkUrl:
        process.env.VSOP_EMAIL_LOGO_DARK_URL ??
        'https://res.cloudinary.com/efvls9rz/image/upload/f_auto,q_auto,w_280/v1784112447/vsop-logo-light-1_pesrls.webp',
    },
    appUrls: {
      /** Canonical public UI origin for email links (invite, open ticket, logo href) */
      frontendUrl,
    },
    invites: {
      expiryHours: parseInt(process.env.INVITE_EXPIRY_HOURS ?? '48', 10),
    },
    rateLimit: {
      intakeTtl: parseInt(process.env.INTAKE_RATE_LIMIT_TTL ?? '3600', 10),
      intakeMax: parseInt(process.env.INTAKE_RATE_LIMIT_MAX ?? '10', 10),
    },
  };
};

export type AppConfig = ReturnType<typeof configuration>;
