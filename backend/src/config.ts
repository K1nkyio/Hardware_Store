import dotenv from "dotenv";

dotenv.config();

function requireEnv(name: string): string {
  const v = process.env[name];
  if (!v) throw new Error(`Missing env var: ${name}`);
  return v;
}

export function normalizeOrigin(value: string): string {
  return value.trim().replace(/\/+$/, "").toLowerCase();
}

function splitCsv(value?: string): string[] {
  if (!value) return [];
  return value
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);
}

function parsePositiveInt(name: string, fallback: number): number {
  const raw = process.env[name];
  if (!raw) return fallback;
  const value = Number(raw);
  if (!Number.isFinite(value) || value <= 0) return fallback;
  return Math.floor(value);
}

function parseBoolean(name: string, fallback: boolean): boolean {
  const raw = process.env[name];
  if (!raw) return fallback;
  const value = raw.trim().toLowerCase();
  if (value === "true" || value === "1" || value === "yes") return true;
  if (value === "false" || value === "0" || value === "no") return false;
  return fallback;
}

export const config = {
  nodeEnv: process.env.NODE_ENV ?? "development",
  port: Number(process.env.PORT ?? "5000"),
  databaseUrl: requireEnv("DATABASE_URL"),
  siteUrl: normalizeOrigin(process.env.SITE_URL ?? "http://localhost:8081"),
  paymentRedirectUrl: normalizeOrigin(
    process.env.PAYMENT_REDIRECT_URL ?? `${process.env.SITE_URL ?? "http://localhost:8081"}/checkout`
  ),
  darajaBaseUrl: (process.env.DARAJA_BASE_URL ?? "https://sandbox.safaricom.co.ke").replace(/\/+$/, ""),
  darajaConsumerKey: process.env.DARAJA_CONSUMER_KEY ?? "",
  darajaConsumerSecret: process.env.DARAJA_CONSUMER_SECRET ?? "",
  darajaShortCode: process.env.DARAJA_SHORTCODE ?? "",
  darajaPassKey: process.env.DARAJA_PASSKEY ?? "",
  darajaCallbackUrl: process.env.DARAJA_CALLBACK_URL ?? process.env.PAYMENT_REDIRECT_URL ?? "http://localhost:8081/checkout",
  pesapalBaseUrl: (process.env.PESAPAL_BASE_URL ?? "https://cybqa.pesapal.com/pesapalv3").replace(/\/+$/, ""),
  pesapalConsumerKey: process.env.PESAPAL_CONSUMER_KEY ?? "",
  pesapalConsumerSecret: process.env.PESAPAL_CONSUMER_SECRET ?? "",
  pesapalNotificationId: process.env.PESAPAL_NOTIFICATION_ID ?? "",
  pesapalCallbackUrl: process.env.PESAPAL_CALLBACK_URL ?? process.env.PAYMENT_REDIRECT_URL ?? "http://localhost:8081/checkout",
  corsOrigins: Array.from(
    new Set(
      [
        "http://localhost:5173",
        "http://localhost:5174",
        "http://localhost:8080",
        "http://localhost:8081",
        process.env.CORS_ORIGIN_ADMIN,
        process.env.CORS_ORIGIN_USER,
        ...splitCsv(process.env.CORS_ORIGINS),
      ]
        .filter((v): v is string => Boolean(v))
        .map(normalizeOrigin)
    )
  ),
  allowLocalhostCors: (process.env.ALLOW_LOCALHOST_CORS ?? "true").toLowerCase() !== "false",
  uploadDir: process.env.UPLOAD_DIR ?? "uploads",
  jwtAccessSecret: process.env.JWT_ACCESS_SECRET ?? "dev-access-secret-change-me",
  jwtRefreshSecret: process.env.JWT_REFRESH_SECRET ?? "dev-refresh-secret-change-me",
  jwtAccessTtlSeconds: parsePositiveInt("JWT_ACCESS_TTL_SECONDS", 60 * 15),
  jwtRefreshTtlSeconds: parsePositiveInt("JWT_REFRESH_TTL_SECONDS", 60 * 60 * 24 * 30),
  passwordHashRounds: parsePositiveInt("PASSWORD_HASH_ROUNDS", 12),
  authCookieSecure: parseBoolean(
    "AUTH_COOKIE_SECURE",
    (process.env.NODE_ENV ?? "development").toLowerCase() === "production"
  ),
  authCookieSameSite: (process.env.AUTH_COOKIE_SAMESITE ?? "lax").toLowerCase(),
  loginMaxFailures: parsePositiveInt("LOGIN_MAX_FAILURES", 5),
  loginLockoutMinutes: parsePositiveInt("LOGIN_LOCKOUT_MINUTES", 15),
  adminMfaIssuer: process.env.ADMIN_MFA_ISSUER ?? "Hardware Store Admin",
  exposeDebugTokens: parseBoolean(
    "AUTH_EXPOSE_DEBUG_TOKENS",
    (process.env.NODE_ENV ?? "development").toLowerCase() !== "production"
  ),
  resetTokenTtlSeconds: parsePositiveInt("RESET_TOKEN_TTL_SECONDS", 60 * 30),
  verificationTokenTtlSeconds: parsePositiveInt("VERIFICATION_TOKEN_TTL_SECONDS", 60 * 60 * 24),
  mfaSetupTokenTtlSeconds: parsePositiveInt("MFA_SETUP_TOKEN_TTL_SECONDS", 60 * 10),
};
