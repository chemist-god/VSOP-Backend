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

export const configuration = () => {
  const nodeEnv = process.env.NODE_ENV ?? 'development';

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
      corsOrigins: parseCsv(process.env.CORS_ORIGINS, [
        process.env.FRONTEND_URL ?? 'http://localhost:3000',
      ]),
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
    appUrls: {
      frontendUrl: process.env.FRONTEND_URL ?? 'http://localhost:3000',
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
