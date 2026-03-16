import {
  createCipheriv,
  createDecipheriv,
  createHash,
  createHmac,
  randomBytes,
  randomUUID,
} from "node:crypto";
import type { Request, Response } from "express";
import { config } from "../config";
import { pool } from "../db/pool";
import { hashPassword, signToken, verifyPassword, verifyToken } from "../lib/authCrypto";

export type AuthDomain = "customer" | "admin";
export type AdminRole = "viewer" | "manager" | "super_admin";

export type CustomerAuthUser = {
  id: string;
  email: string;
  username: string;
  fullName: string;
  role: "customer";
  isActive: boolean;
  emailVerified: boolean;
  status: string;
  phone?: string;
  address?: string;
};

export type AdminAuthUser = {
  id: string;
  email: string;
  username: string;
  fullName: string;
  role: AdminRole;
  isActive: boolean;
  emailVerified: boolean;
  status: string;
  mfaEnabled: boolean;
  mfaResetRequired: boolean;
};

export type PublicAuthUser = CustomerAuthUser | AdminAuthUser;

type SessionContext = {
  ip: string | null;
  device: string | null;
};

type RefreshPayload = {
  sub: string;
  sid: string;
  domain: AuthDomain;
  mfaPending: boolean;
};

type CustomerWithSecrets = CustomerAuthUser & {
  passwordHash: string | null;
  lockedUntil: string | null;
};

export function getSessionContext(req: Request): SessionContext {
  return {
    ip: req.ip ?? req.socket.remoteAddress ?? null,
    device: req.header("user-agent") ?? null,
  };
}

const REFRESH_COOKIE_BY_DOMAIN: Record<AuthDomain, string> = {
  customer: "hs_customer_refresh",
  admin: "hs_admin_refresh",
};

const COOKIE_PATH_BY_DOMAIN: Record<AuthDomain, string> = {
  customer: "/api/auth",
  admin: "/api",
};

function normalizeSameSite(value: string): "strict" | "lax" | "none" {
  if (value === "strict") return "strict";
  if (value === "none") return "none";
  return "lax";
}

function parseCookieHeader(raw?: string): Record<string, string> {
  if (!raw) return {};
  return raw.split(";").reduce<Record<string, string>>((acc, pair) => {
    const [name, ...rest] = pair.trim().split("=");
    if (!name || rest.length === 0) return acc;
    acc[name] = decodeURIComponent(rest.join("="));
    return acc;
  }, {});
}

export function readRefreshCookie(req: Request, domain: AuthDomain): string | null {
  const cookies = parseCookieHeader(req.header("cookie") ?? undefined);
  const value = cookies[REFRESH_COOKIE_BY_DOMAIN[domain]];
  if (!value || value.trim() === "") return null;
  return value;
}

export function setRefreshCookie(res: Response, domain: AuthDomain, refreshToken: string) {
  res.cookie(REFRESH_COOKIE_BY_DOMAIN[domain], refreshToken, {
    httpOnly: true,
    secure: config.authCookieSecure,
    sameSite: normalizeSameSite(config.authCookieSameSite),
    path: COOKIE_PATH_BY_DOMAIN[domain],
    maxAge: config.jwtRefreshTtlSeconds * 1000,
  });
}

export function clearRefreshCookie(res: Response, domain: AuthDomain) {
  res.clearCookie(REFRESH_COOKIE_BY_DOMAIN[domain], {
    httpOnly: true,
    secure: config.authCookieSecure,
    sameSite: normalizeSameSite(config.authCookieSameSite),
    path: COOKIE_PATH_BY_DOMAIN[domain],
  });
}

function normalizeEmail(value: string): string {
  return value.trim().toLowerCase();
}

function normalizeName(value: string): string {
  return value.trim().replace(/\s+/g, " ");
}

function sanitizeUsername(value: string): string {
  return value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9._-]+/g, "_")
    .replace(/^[_\-.]+|[_\-.]+$/g, "");
}

function normalizeUsername(value: string): string {
  const username = sanitizeUsername(value);
  if (username.length < 3 || username.length > 30) {
    throw new Error("Username must be 3-30 characters and use only letters, numbers, dots, hyphens, or underscores");
  }
  return username;
}

function hashToken(value: string): string {
  return createHash("sha256").update(value).digest("hex");
}

function buildAccessToken(user: PublicAuthUser, sessionId: string, mfaPending = false): string {
  if (user.role === "customer") {
    return signToken(
      {
        sub: user.id,
        role: "user",
        domain: "customer",
        sid: sessionId,
        email: user.email,
        name: user.fullName,
        type: "access",
      },
      config.jwtAccessSecret,
      config.jwtAccessTtlSeconds
    );
  }

  return signToken(
    {
      sub: user.id,
      role: user.role,
      domain: "admin",
      sid: sessionId,
      email: user.email,
      name: user.fullName,
      mfa: mfaPending ? "pending" : "verified",
      type: "admin",
    },
    config.jwtAccessSecret,
    config.jwtAccessTtlSeconds
  );
}

function buildRefreshToken(user: PublicAuthUser, sessionId: string, mfaPending = false): string {
  return signToken(
    {
      sub: user.id,
      sid: sessionId,
      domain: user.role === "customer" ? "customer" : "admin",
      mfa: mfaPending ? "pending" : "verified",
      type: "refresh",
    },
    config.jwtRefreshSecret,
    config.jwtRefreshTtlSeconds
  );
}

function parseRefreshToken(token: string): RefreshPayload | null {
  const decoded = verifyToken(token, config.jwtRefreshSecret);
  if (!decoded) return null;
  const sub = typeof decoded.sub === "string" ? decoded.sub : "";
  const sid = typeof decoded.sid === "string" ? decoded.sid : "";
  const type = typeof decoded.type === "string" ? decoded.type : "";
  if (!sub || !sid || (type && type !== "refresh")) return null;
  const domain: AuthDomain = decoded.domain === "admin" ? "admin" : "customer";
  return { sub, sid, domain, mfaPending: decoded.mfa === "pending" };
}

function isLocked(lockedUntil: string | null): boolean {
  if (!lockedUntil) return false;
  const ts = new Date(lockedUntil).getTime();
  return Number.isFinite(ts) && ts > Date.now();
}

async function ensureEmailNotUsed(email: string) {
  const normalized = normalizeEmail(email);
  const { rowCount } = await pool.query(
    `SELECT 1 FROM users WHERE lower(email) = $1
     UNION ALL
     SELECT 1 FROM admins WHERE lower(email) = $1
     LIMIT 1`,
    [normalized]
  );
  if ((rowCount ?? 0) > 0) throw new Error("An account with that email already exists");
}

async function ensureUsernameNotUsed(username: string) {
  const normalized = normalizeUsername(username);
  const { rowCount } = await pool.query(
    `SELECT 1 FROM users WHERE lower(username) = $1
     UNION ALL
     SELECT 1 FROM admins WHERE lower(username) = $1
     LIMIT 1`,
    [normalized]
  );
  if ((rowCount ?? 0) > 0) throw new Error("An account with that username already exists");
}

function mapCustomerRow(row: Record<string, unknown>): CustomerAuthUser {
  const email = normalizeEmail(String(row.email ?? ""));
  const username = sanitizeUsername(String(row.username ?? email.split("@")[0] ?? "user")) || "user";
  const fullName = normalizeName(
    String(row.profile_name ?? row.full_name ?? email.split("@")[0] ?? "Customer")
  );
  const emailVerified = Boolean(row.email_verified) || Boolean(row.email_verified_at);
  const status = String(row.status ?? (row.is_active ? "active" : "disabled")).toLowerCase();
  return {
    id: String(row.id),
    email,
    username,
    fullName,
    role: "customer",
    isActive: status === "active",
    emailVerified,
    status,
    phone: row.phone ? String(row.phone) : undefined,
    address: row.address ? String(row.address) : undefined,
  };
}

async function getCustomerByEmail(email: string): Promise<CustomerWithSecrets | null> {
  const { rows } = await pool.query(
    `SELECT
      u.id, u.email, u.username, u.password_hash, u.full_name, up.name AS profile_name, up.phone, up.address,
      u.status, u.is_active, u.email_verified, u.email_verified_at::text, u.locked_until::text
     FROM users u
     LEFT JOIN user_profiles up ON up.user_id = u.id
     WHERE lower(u.email) = $1
     LIMIT 1`,
    [normalizeEmail(email)]
  );
  if (rows.length === 0) return null;
  const row = rows[0] as Record<string, unknown>;
  return {
    ...mapCustomerRow(row),
    passwordHash: row.password_hash ? String(row.password_hash) : null,
    lockedUntil: row.locked_until ? String(row.locked_until) : null,
  };
}

export async function getCustomerProfile(userId: string): Promise<CustomerAuthUser | null> {
  const { rows } = await pool.query(
    `SELECT
      u.id, u.email, u.username, u.full_name, up.name AS profile_name, up.phone, up.address,
      u.status, u.is_active, u.email_verified, u.email_verified_at::text
     FROM users u
     LEFT JOIN user_profiles up ON up.user_id = u.id
     WHERE u.id = $1
     LIMIT 1`,
    [userId]
  );
  if (rows.length === 0) return null;
  return mapCustomerRow(rows[0] as Record<string, unknown>);
}

async function createCustomerSession(
  user: CustomerAuthUser,
  context: SessionContext
): Promise<{ accessToken: string; refreshToken: string; accessTokenExpiresIn: number; refreshTokenExpiresIn: number; sessionId: string }> {
  const sessionId = randomUUID();
  const refreshToken = buildRefreshToken(user, sessionId);
  const accessToken = buildAccessToken(user, sessionId);
  await pool.query(
    `INSERT INTO user_sessions (id, user_id, refresh_token_hash, device, ip, expires_at, last_used_at)
     VALUES ($1, $2, $3, $4, $5, now() + ($6::int * interval '1 second'), now())`,
    [sessionId, user.id, hashToken(refreshToken), context.device, context.ip, config.jwtRefreshTtlSeconds]
  );
  return {
    sessionId,
    accessToken,
    refreshToken,
    accessTokenExpiresIn: config.jwtAccessTtlSeconds,
    refreshTokenExpiresIn: config.jwtRefreshTtlSeconds,
  };
}

async function issueUserToken(userId: string, type: "email_verify" | "password_reset", ttlSeconds: number): Promise<string> {
  const token = randomBytes(32).toString("hex");
  await pool.query(
    `INSERT INTO user_auth_tokens (user_id, token_type, token_hash, expires_at)
     VALUES ($1, $2, $3, now() + ($4::int * interval '1 second'))`,
    [userId, type, hashToken(token), ttlSeconds]
  );
  return token;
}

async function consumeUserToken(token: string, type: "email_verify" | "password_reset"): Promise<string | null> {
  const { rows } = await pool.query<{ user_id: string }>(
    `UPDATE user_auth_tokens
     SET used_at = now()
     WHERE token_hash = $1
       AND token_type = $2
       AND used_at IS NULL
       AND expires_at > now()
     RETURNING user_id`,
    [hashToken(token), type]
  );
  return rows[0]?.user_id ?? null;
}

export async function registerCustomer(payload: {
  email: string;
  password: string;
  username: string;
  fullName: string;
  phone?: string;
  address?: string;
}): Promise<{ user: CustomerAuthUser; verificationToken?: string }> {
  const email = normalizeEmail(payload.email);
  const username = normalizeUsername(payload.username);
  const fullName = normalizeName(payload.fullName || payload.username);
  await ensureEmailNotUsed(email);
  await ensureUsernameNotUsed(username);

  const passwordHash = await hashPassword(payload.password, config.passwordHashRounds);
  const { rows } = await pool.query(
    `INSERT INTO users (email, username, full_name, role, auth_domain, password_hash, email_verified, status, is_active)
     VALUES ($1, $2, $3, 'customer', 'customer', $4, false, 'active', true)
     RETURNING id, email, username, full_name, status, is_active, email_verified, email_verified_at::text`,
    [email, username, fullName, passwordHash]
  );

  await pool.query(
    `INSERT INTO user_profiles (user_id, name, phone, address)
     VALUES ($1, $2, $3, $4)
     ON CONFLICT (user_id)
     DO UPDATE SET name = EXCLUDED.name, phone = EXCLUDED.phone, address = EXCLUDED.address`,
    [rows[0].id, fullName, payload.phone ?? null, payload.address ?? null]
  );

  const user = await getCustomerProfile(String(rows[0].id));
  if (!user) throw new Error("Could not load created user");
  const token = await issueUserToken(user.id, "email_verify", config.verificationTokenTtlSeconds);

  return {
    user,
    verificationToken: config.exposeDebugTokens ? token : undefined,
  };
}

export async function loginCustomer(
  payload: { email: string; password: string },
  context: SessionContext
): Promise<{ user: CustomerAuthUser; accessToken: string; refreshToken: string; accessTokenExpiresIn: number; refreshTokenExpiresIn: number }> {
  const user = await getCustomerByEmail(payload.email);
  if (!user || !user.passwordHash) throw new Error("Invalid email or password");
  if (isLocked(user.lockedUntil)) throw new Error("Account temporarily locked due to repeated failures");

  const passwordOk = await verifyPassword(payload.password, user.passwordHash);
  if (!passwordOk) throw new Error("Invalid email or password");
  if (!user.isActive || user.status !== "active") throw new Error("Account is disabled. Please contact support.");
  if (!user.emailVerified) throw new Error("Please verify your email before signing in");

  const session = await createCustomerSession(user, context);
  return {
    user,
    accessToken: session.accessToken,
    refreshToken: session.refreshToken,
    accessTokenExpiresIn: session.accessTokenExpiresIn,
    refreshTokenExpiresIn: session.refreshTokenExpiresIn,
  };
}

export async function refreshCustomerSession(refreshToken: string): Promise<{
  user: CustomerAuthUser;
  accessToken: string;
  refreshToken: string;
  accessTokenExpiresIn: number;
}> {
  const payload = parseRefreshToken(refreshToken);
  if (!payload || payload.domain !== "customer") throw new Error("Invalid refresh token");

  const { rows } = await pool.query(
    `SELECT
      s.id, s.user_id, s.expires_at::text, s.revoked_at::text,
      u.id AS customer_id, u.email, u.full_name, up.name AS profile_name, up.phone, up.address,
      u.status, u.is_active, u.email_verified, u.email_verified_at::text
     FROM user_sessions s
     INNER JOIN users u ON u.id = s.user_id
     LEFT JOIN user_profiles up ON up.user_id = u.id
     WHERE s.id = $1
       AND s.user_id = $2
       AND s.refresh_token_hash = $3
     LIMIT 1`,
    [payload.sid, payload.sub, hashToken(refreshToken)]
  );
  if (rows.length === 0) throw new Error("Refresh token is no longer valid");

  const row = rows[0] as Record<string, unknown>;
  const isExpired = new Date(String(row.expires_at)).getTime() <= Date.now();
  if (isExpired || Boolean(row.revoked_at)) throw new Error("Refresh token has expired");

  const user = mapCustomerRow({
    ...row,
    id: row.customer_id,
  });
  if (!user.isActive || user.status !== "active") throw new Error("Account is disabled. Please contact support.");

  const nextRefresh = buildRefreshToken(user, payload.sid);
  const nextAccess = buildAccessToken(user, payload.sid);

  await pool.query(
    `UPDATE user_sessions
     SET refresh_token_hash = $1,
         expires_at = now() + ($2::int * interval '1 second'),
         last_used_at = now()
     WHERE id = $3`,
    [hashToken(nextRefresh), config.jwtRefreshTtlSeconds, payload.sid]
  );

  return {
    user,
    accessToken: nextAccess,
    refreshToken: nextRefresh,
    accessTokenExpiresIn: config.jwtAccessTtlSeconds,
  };
}

export async function logoutCustomer(userId: string, sessionId?: string, allSessions = false): Promise<void> {
  if (allSessions) {
    await pool.query("UPDATE user_sessions SET revoked_at = COALESCE(revoked_at, now()) WHERE user_id = $1", [userId]);
    return;
  }
  if (!sessionId) return;
  await pool.query(
    `UPDATE user_sessions
     SET revoked_at = COALESCE(revoked_at, now())
     WHERE id = $1
       AND user_id = $2`,
    [sessionId, userId]
  );
}

export async function listCustomerSessions(userId: string, currentSessionId?: string) {
  const { rows } = await pool.query(
    `SELECT id::text, device, ip, created_at::text, last_used_at::text, expires_at::text, revoked_at::text
     FROM user_sessions
     WHERE user_id = $1
       AND expires_at > now()
     ORDER BY last_used_at DESC NULLS LAST, created_at DESC`,
    [userId]
  );

  return {
    currentSessionId: currentSessionId ?? "",
    sessions: rows.map((row) => ({
      id: String(row.id),
      userAgent: row.device ? String(row.device) : "",
      ipAddress: row.ip ? String(row.ip) : "",
      createdAt: String(row.created_at),
      lastSeenAt: row.last_used_at ? String(row.last_used_at) : String(row.created_at),
      expiresAt: String(row.expires_at),
      revokedAt: row.revoked_at ? String(row.revoked_at) : null,
      current: String(row.id) === currentSessionId,
    })),
  };
}

export async function revokeCustomerSession(userId: string, sessionId: string): Promise<void> {
  await pool.query(
    `UPDATE user_sessions
     SET revoked_at = COALESCE(revoked_at, now())
     WHERE id = $1
       AND user_id = $2`,
    [sessionId, userId]
  );
}

export async function requestCustomerEmailVerification(payload: {
  actorUserId?: string;
  email?: string;
}): Promise<{ ok: boolean; verificationToken?: string }> {
  let userId = payload.actorUserId;
  if (!userId && payload.email) {
    userId = (await getCustomerByEmail(payload.email))?.id;
  }
  if (!userId) return { ok: true };
  const token = await issueUserToken(userId, "email_verify", config.verificationTokenTtlSeconds);
  return {
    ok: true,
    verificationToken: config.exposeDebugTokens ? token : undefined,
  };
}

export async function verifyCustomerEmail(token: string): Promise<void> {
  const userId = await consumeUserToken(token, "email_verify");
  if (!userId) throw new Error("Invalid or expired verification token");
  await pool.query(
    `UPDATE users
     SET email_verified = true,
         email_verified_at = now()
     WHERE id = $1`,
    [userId]
  );
}

export async function requestCustomerPasswordReset(email: string): Promise<{ ok: boolean; resetToken?: string }> {
  const user = await getCustomerByEmail(email);
  if (!user) return { ok: true };
  const token = await issueUserToken(user.id, "password_reset", config.resetTokenTtlSeconds);
  return {
    ok: true,
    resetToken: config.exposeDebugTokens ? token : undefined,
  };
}

export async function resetCustomerPassword(token: string, password: string): Promise<void> {
  const userId = await consumeUserToken(token, "password_reset");
  if (!userId) throw new Error("Invalid or expired password reset token");

  const hashed = await hashPassword(password, config.passwordHashRounds);
  await pool.query(
    `UPDATE users
     SET password_hash = $2
     WHERE id = $1`,
    [userId, hashed]
  );
  await pool.query("UPDATE user_sessions SET revoked_at = COALESCE(revoked_at, now()) WHERE user_id = $1", [userId]);
}

type AdminWithSecrets = AdminAuthUser & {
  passwordHash: string | null;
  lockedUntil: string | null;
  mfaSecret: string | null;
  mfaRecoveryCodes: string[];
};

function normalizeAdminRole(role: string): AdminRole {
  const normalized = role.trim().toLowerCase();
  if (normalized === "super_admin") return "super_admin";
  if (normalized === "manager") return "manager";
  return "viewer";
}

function mapAdminRow(row: Record<string, unknown>): AdminAuthUser {
  const email = normalizeEmail(String(row.email ?? ""));
  const username = sanitizeUsername(String(row.username ?? email.split("@")[0] ?? "admin")) || "admin";
  const fullName = normalizeName(String(row.full_name ?? email.split("@")[0] ?? "Admin"));
  const status = String(row.status ?? "active").toLowerCase();
  return {
    id: String(row.id),
    email,
    username,
    fullName,
    role: normalizeAdminRole(String(row.role ?? "viewer")),
    isActive: status === "active",
    emailVerified: true,
    status,
    mfaEnabled: Boolean(row.mfa_enabled),
    mfaResetRequired: Boolean(row.mfa_reset_required),
  };
}

async function getAdminByEmail(email: string): Promise<AdminWithSecrets | null> {
  const { rows } = await pool.query(
    `SELECT
      id, email, username, full_name, password_hash, role, mfa_enabled, mfa_secret, mfa_recovery_codes,
      mfa_reset_required, status, locked_until::text
     FROM admins
     WHERE lower(email) = $1
     LIMIT 1`,
    [normalizeEmail(email)]
  );
  if (rows.length === 0) return null;
  const row = rows[0] as Record<string, unknown>;
  return {
    ...mapAdminRow(row),
    passwordHash: row.password_hash ? String(row.password_hash) : null,
    lockedUntil: row.locked_until ? String(row.locked_until) : null,
    mfaSecret: row.mfa_secret ? String(row.mfa_secret) : null,
    mfaRecoveryCodes: Array.isArray(row.mfa_recovery_codes)
      ? (row.mfa_recovery_codes as string[])
      : [],
  };
}

export async function getAdminProfile(adminId: string): Promise<AdminAuthUser | null> {
  const { rows } = await pool.query(
    `SELECT id, email, username, full_name, role, mfa_enabled, mfa_reset_required, status
     FROM admins
     WHERE id = $1
     LIMIT 1`,
    [adminId]
  );
  if (rows.length === 0) return null;
  return mapAdminRow(rows[0] as Record<string, unknown>);
}

async function createAdminSession(
  user: AdminAuthUser,
  context: SessionContext,
  mfaPending: boolean
): Promise<{ accessToken: string; refreshToken: string; accessTokenExpiresIn: number; refreshTokenExpiresIn: number; sessionId: string }> {
  const sessionId = randomUUID();
  const refreshToken = buildRefreshToken(user, sessionId, mfaPending);
  const accessToken = buildAccessToken(user, sessionId, mfaPending);
  await pool.query(
    `INSERT INTO admin_sessions (id, admin_id, refresh_token_hash, ip, device, expires_at, last_used_at)
     VALUES ($1, $2, $3, $4, $5, now() + ($6::int * interval '1 second'), now())`,
    [sessionId, user.id, hashToken(refreshToken), context.ip, context.device, config.jwtRefreshTtlSeconds]
  );
  return {
    sessionId,
    accessToken,
    refreshToken,
    accessTokenExpiresIn: config.jwtAccessTtlSeconds,
    refreshTokenExpiresIn: config.jwtRefreshTtlSeconds,
  };
}

function encryptedMfaSecret(secret: string): string {
  const key = createHash("sha256").update(config.jwtRefreshSecret).digest();
  const iv = randomBytes(12);
  const cipher = createCipheriv("aes-256-gcm", key, iv);
  const encrypted = Buffer.concat([cipher.update(secret, "utf-8"), cipher.final()]);
  const tag = cipher.getAuthTag();
  return `${iv.toString("hex")}.${tag.toString("hex")}.${encrypted.toString("hex")}`;
}

function decryptMfaSecret(encoded: string): string | null {
  const [ivHex, tagHex, payloadHex] = encoded.split(".");
  if (!ivHex || !tagHex || !payloadHex) return null;
  try {
    const key = createHash("sha256").update(config.jwtRefreshSecret).digest();
    const decipher = createDecipheriv("aes-256-gcm", key, Buffer.from(ivHex, "hex"));
    decipher.setAuthTag(Buffer.from(tagHex, "hex"));
    const decrypted = Buffer.concat([decipher.update(Buffer.from(payloadHex, "hex")), decipher.final()]);
    return decrypted.toString("utf-8");
  } catch {
    return null;
  }
}

const BASE32_ALPHABET = "ABCDEFGHIJKLMNOPQRSTUVWXYZ234567";

function encodeBase32(buffer: Buffer): string {
  let bits = 0;
  let value = 0;
  let output = "";
  for (const byte of buffer) {
    value = (value << 8) | byte;
    bits += 8;
    while (bits >= 5) {
      output += BASE32_ALPHABET[(value >>> (bits - 5)) & 31];
      bits -= 5;
    }
  }
  if (bits > 0) output += BASE32_ALPHABET[(value << (5 - bits)) & 31];
  return output;
}

function decodeBase32(input: string): Buffer {
  const normalized = input.toUpperCase().replace(/=+$/g, "").replace(/[^A-Z2-7]/g, "");
  let bits = 0;
  let value = 0;
  const bytes: number[] = [];
  for (const char of normalized) {
    const idx = BASE32_ALPHABET.indexOf(char);
    if (idx === -1) continue;
    value = (value << 5) | idx;
    bits += 5;
    if (bits >= 8) {
      bytes.push((value >>> (bits - 8)) & 255);
      bits -= 8;
    }
  }
  return Buffer.from(bytes);
}

function generateTotp(secretBase32: string, timestampMs = Date.now()): string {
  const counter = Math.floor(timestampMs / 30_000);
  const key = decodeBase32(secretBase32);
  const message = Buffer.alloc(8);
  message.writeBigUInt64BE(BigInt(counter));
  const digest = createHmac("sha1", key).update(message).digest();
  const offset = digest[digest.length - 1] & 0x0f;
  const binary =
    ((digest[offset] & 0x7f) << 24) |
    ((digest[offset + 1] & 0xff) << 16) |
    ((digest[offset + 2] & 0xff) << 8) |
    (digest[offset + 3] & 0xff);
  return (binary % 1_000_000).toString().padStart(6, "0");
}

function verifyTotp(secretBase32: string, code: string): boolean {
  const normalized = code.trim();
  if (!/^\d{6}$/.test(normalized)) return false;
  for (const offset of [-30_000, 0, 30_000]) {
    if (generateTotp(secretBase32, Date.now() + offset) === normalized) return true;
  }
  return false;
}

function hashBackupCode(code: string): string {
  return createHash("sha256").update(`backup:${code.trim().toUpperCase()}`).digest("hex");
}

function generateRecoveryCodes(count = 10): string[] {
  const codes: string[] = [];
  for (let index = 0; index < count; index += 1) {
    const raw = randomBytes(4).toString("hex").toUpperCase();
    codes.push(`${raw.slice(0, 4)}-${raw.slice(4, 8)}`);
  }
  return codes;
}

export async function seedSuperAdmin(
  payload: { email: string; password: string; username: string; fullName: string },
  context: SessionContext
): Promise<{ user: AdminAuthUser; accessToken: string; refreshToken: string; accessTokenExpiresIn: number; refreshTokenExpiresIn: number; mfaSetupRequired: boolean }> {
  const existing = await pool.query<{ count: string }>("SELECT COUNT(*)::text AS count FROM admins");
  if (Number(existing.rows[0]?.count ?? "0") > 0) {
    throw new Error("An admin already exists. Use /admin/auth/register with super_admin auth.");
  }
  await ensureEmailNotUsed(payload.email);
  await ensureUsernameNotUsed(payload.username);
  const hash = await hashPassword(payload.password, config.passwordHashRounds);
  const { rows } = await pool.query(
    `INSERT INTO admins (email, username, full_name, password_hash, role, status)
     VALUES ($1, $2, $3, $4, 'super_admin', 'active')
     RETURNING id, email, username, full_name, role, mfa_enabled, mfa_reset_required, status`,
    [normalizeEmail(payload.email), normalizeUsername(payload.username), normalizeName(payload.fullName), hash]
  );
  const user = mapAdminRow(rows[0] as Record<string, unknown>);
  await pool.query(
    `INSERT INTO admin_roles (admin_id, role)
     VALUES ($1, 'super_admin')
     ON CONFLICT (admin_id) DO UPDATE SET role = EXCLUDED.role, assigned_at = now()`,
    [user.id]
  );
  const session = await createAdminSession(user, context, true);
  return {
    user,
    accessToken: session.accessToken,
    refreshToken: session.refreshToken,
    accessTokenExpiresIn: session.accessTokenExpiresIn,
    refreshTokenExpiresIn: session.refreshTokenExpiresIn,
    mfaSetupRequired: true,
  };
}

export async function registerAdmin(payload: {
  email: string;
  password: string;
  username: string;
  fullName: string;
  role: AdminRole;
}): Promise<AdminAuthUser> {
  await ensureEmailNotUsed(payload.email);
  await ensureUsernameNotUsed(payload.username);
  const hash = await hashPassword(payload.password, config.passwordHashRounds);
  const role = normalizeAdminRole(payload.role);
  const { rows } = await pool.query(
    `INSERT INTO admins (email, username, full_name, password_hash, role, status)
     VALUES ($1, $2, $3, $4, $5, 'active')
     RETURNING id, email, username, full_name, role, mfa_enabled, mfa_reset_required, status`,
    [normalizeEmail(payload.email), normalizeUsername(payload.username), normalizeName(payload.fullName), hash, role]
  );
  const user = mapAdminRow(rows[0] as Record<string, unknown>);
  await pool.query(
    `INSERT INTO admin_roles (admin_id, role)
     VALUES ($1, $2)
     ON CONFLICT (admin_id) DO UPDATE SET role = EXCLUDED.role, assigned_at = now()`,
    [user.id, user.role]
  );
  return user;
}

export async function registerAdminSelf(
  payload: { email: string; password: string; username: string; fullName?: string },
  context: SessionContext
): Promise<{ user: AdminAuthUser; accessToken: string; refreshToken: string; accessTokenExpiresIn: number; refreshTokenExpiresIn: number }> {
  const user = await registerAdmin({
    email: payload.email,
    password: payload.password,
    username: payload.username,
    fullName: payload.fullName?.trim() ? payload.fullName : payload.username,
    role: "viewer",
  });
  const session = await createAdminSession(user, context, false);
  return {
    user,
    accessToken: session.accessToken,
    refreshToken: session.refreshToken,
    accessTokenExpiresIn: session.accessTokenExpiresIn,
    refreshTokenExpiresIn: session.refreshTokenExpiresIn,
  };
}

export async function loginAdmin(
  payload: { email: string; password: string; mfaCode?: string; recoveryCode?: string },
  context: SessionContext
): Promise<{ user: AdminAuthUser; accessToken: string; refreshToken: string; accessTokenExpiresIn: number; refreshTokenExpiresIn: number; mfaSetupRequired?: boolean }> {
  const admin = await getAdminByEmail(payload.email);
  if (!admin || !admin.passwordHash) throw new Error("Invalid email or password");
  if (isLocked(admin.lockedUntil)) throw new Error("Account temporarily locked due to repeated failures");

  const passwordOk = await verifyPassword(payload.password, admin.passwordHash);
  if (!passwordOk) throw new Error("Invalid email or password");
  if (!admin.isActive || admin.status !== "active") throw new Error("Admin account is disabled");

  const secret = admin.mfaSecret ? decryptMfaSecret(admin.mfaSecret) : null;
  const superAdminNeedsSetup =
    admin.role === "super_admin" && (!admin.mfaEnabled || admin.mfaResetRequired || !secret);
  let mfaPending = false;

  if (admin.mfaEnabled && secret && !admin.mfaResetRequired) {
    const mfaCode = payload.mfaCode?.trim() ?? "";
    const recoveryCode = payload.recoveryCode?.trim().toUpperCase() ?? "";
    let ok = false;
    if (mfaCode && verifyTotp(secret, mfaCode)) ok = true;

    if (!ok && recoveryCode) {
      const hashed = hashBackupCode(recoveryCode);
      const matched = admin.mfaRecoveryCodes.find((entry) => entry === hashed);
      if (matched) {
        ok = true;
        const nextCodes = admin.mfaRecoveryCodes.filter((entry) => entry !== matched);
        await pool.query("UPDATE admins SET mfa_recovery_codes = $2 WHERE id = $1", [admin.id, nextCodes]);
      }
    }

    if (!ok) throw new Error("MFA code or recovery code is required");
  } else if (superAdminNeedsSetup) {
    mfaPending = true;
  }

  const session = await createAdminSession(admin, context, mfaPending);
  return {
    user: admin,
    accessToken: session.accessToken,
    refreshToken: session.refreshToken,
    accessTokenExpiresIn: session.accessTokenExpiresIn,
    refreshTokenExpiresIn: session.refreshTokenExpiresIn,
    mfaSetupRequired: mfaPending || undefined,
  };
}

export async function refreshAdminSession(refreshToken: string): Promise<{
  user: AdminAuthUser;
  accessToken: string;
  refreshToken: string;
  accessTokenExpiresIn: number;
  mfaSetupRequired?: boolean;
}> {
  const payload = parseRefreshToken(refreshToken);
  if (!payload || payload.domain !== "admin") throw new Error("Invalid refresh token");

  const { rows } = await pool.query(
    `SELECT
      s.id, s.admin_id, s.expires_at::text, s.revoked_at::text,
      a.id AS admin_ref, a.email, a.username, a.full_name, a.role, a.mfa_enabled, a.mfa_secret, a.mfa_reset_required, a.status
     FROM admin_sessions s
     INNER JOIN admins a ON a.id = s.admin_id
     WHERE s.id = $1
       AND s.admin_id = $2
       AND s.refresh_token_hash = $3
     LIMIT 1`,
    [payload.sid, payload.sub, hashToken(refreshToken)]
  );
  if (rows.length === 0) throw new Error("Refresh token is no longer valid");

  const row = rows[0] as Record<string, unknown>;
  const isExpired = new Date(String(row.expires_at)).getTime() <= Date.now();
  if (isExpired || Boolean(row.revoked_at)) throw new Error("Refresh token has expired");

  const user = mapAdminRow({
    ...row,
    id: row.admin_ref,
  });
  if (!user.isActive || user.status !== "active") throw new Error("Admin account is disabled");

  const secret = row.mfa_secret ? decryptMfaSecret(String(row.mfa_secret)) : null;
  const forcedPending = user.role === "super_admin" && (!user.mfaEnabled || user.mfaResetRequired || !secret);
  const mfaPending = forcedPending || payload.mfaPending;

  const nextRefresh = buildRefreshToken(user, payload.sid, mfaPending);
  const nextAccess = buildAccessToken(user, payload.sid, mfaPending);

  await pool.query(
    `UPDATE admin_sessions
     SET refresh_token_hash = $1,
         expires_at = now() + ($2::int * interval '1 second'),
         last_used_at = now()
     WHERE id = $3`,
    [hashToken(nextRefresh), config.jwtRefreshTtlSeconds, payload.sid]
  );

  return {
    user,
    accessToken: nextAccess,
    refreshToken: nextRefresh,
    accessTokenExpiresIn: config.jwtAccessTtlSeconds,
    mfaSetupRequired: mfaPending || undefined,
  };
}

export async function logoutAdmin(adminId: string, sessionId?: string, allSessions = false): Promise<void> {
  if (allSessions) {
    await pool.query("UPDATE admin_sessions SET revoked_at = COALESCE(revoked_at, now()) WHERE admin_id = $1", [adminId]);
    return;
  }
  if (!sessionId) return;
  await pool.query(
    `UPDATE admin_sessions
     SET revoked_at = COALESCE(revoked_at, now())
     WHERE id = $1
       AND admin_id = $2`,
    [sessionId, adminId]
  );
}

export async function listAdminSessions(adminId: string, currentSessionId?: string) {
  const { rows } = await pool.query(
    `SELECT id::text, device, ip, created_at::text, last_used_at::text, expires_at::text, revoked_at::text
     FROM admin_sessions
     WHERE admin_id = $1
       AND expires_at > now()
     ORDER BY last_used_at DESC NULLS LAST, created_at DESC`,
    [adminId]
  );

  return {
    currentSessionId: currentSessionId ?? "",
    sessions: rows.map((row) => ({
      id: String(row.id),
      userAgent: row.device ? String(row.device) : "",
      ipAddress: row.ip ? String(row.ip) : "",
      createdAt: String(row.created_at),
      lastSeenAt: row.last_used_at ? String(row.last_used_at) : String(row.created_at),
      expiresAt: String(row.expires_at),
      revokedAt: row.revoked_at ? String(row.revoked_at) : null,
      current: String(row.id) === currentSessionId,
    })),
  };
}

export async function revokeAdminSession(adminId: string, sessionId: string): Promise<void> {
  await pool.query(
    `UPDATE admin_sessions
     SET revoked_at = COALESCE(revoked_at, now())
     WHERE id = $1
       AND admin_id = $2`,
    [sessionId, adminId]
  );
}

export async function setupAdminMfa(adminId: string, adminEmail: string): Promise<{
  secret: string;
  otpauthUri: string;
  backupCodes: string[];
}> {
  const secret = encodeBase32(randomBytes(20));
  const backupCodes = generateRecoveryCodes(10);
  await pool.query(
    `UPDATE admins
     SET mfa_secret = $2,
         mfa_enabled = false,
         mfa_recovery_codes = $3,
         mfa_reset_required = false
     WHERE id = $1`,
    [adminId, encryptedMfaSecret(secret), backupCodes.map(hashBackupCode)]
  );
  const label = encodeURIComponent(adminEmail);
  const issuer = encodeURIComponent(config.adminMfaIssuer);
  return {
    secret,
    otpauthUri: `otpauth://totp/${issuer}:${label}?secret=${secret}&issuer=${issuer}&algorithm=SHA1&digits=6&period=30`,
    backupCodes,
  };
}

export async function activateAdminMfa(
  adminId: string,
  sessionId: string | undefined,
  code: string,
  context: SessionContext
): Promise<{ user: AdminAuthUser; accessToken: string; refreshToken: string; accessTokenExpiresIn: number; refreshTokenExpiresIn: number }> {
  const { rows } = await pool.query(
    `SELECT id, email, full_name, role, mfa_secret, mfa_enabled, mfa_reset_required, status
     FROM admins
     WHERE id = $1
     LIMIT 1`,
    [adminId]
  );
  if (rows.length === 0) throw new Error("Admin account not found");
  const row = rows[0] as Record<string, unknown>;
  if (!row.mfa_secret) throw new Error("MFA setup has not been initialized yet");

  const secret = decryptMfaSecret(String(row.mfa_secret));
  if (!secret || !verifyTotp(secret, code)) throw new Error("Invalid MFA code");

  await pool.query(
    `UPDATE admins
     SET mfa_enabled = true,
         mfa_reset_required = false
     WHERE id = $1`,
    [adminId]
  );
  if (sessionId) {
    await pool.query("UPDATE admin_sessions SET revoked_at = COALESCE(revoked_at, now()) WHERE id = $1 AND admin_id = $2", [
      sessionId,
      adminId,
    ]);
  }

  const user = mapAdminRow({
    ...row,
    mfa_enabled: true,
    mfa_reset_required: false,
  });
  const session = await createAdminSession(user, context, false);
  return {
    user,
    accessToken: session.accessToken,
    refreshToken: session.refreshToken,
    accessTokenExpiresIn: session.accessTokenExpiresIn,
    refreshTokenExpiresIn: session.refreshTokenExpiresIn,
  };
}

export async function regenerateAdminRecoveryCodes(payload: {
  adminId: string;
  mfaCode?: string;
  recoveryCode?: string;
}): Promise<{ backupCodes: string[] }> {
  const { rows } = await pool.query(
    `SELECT mfa_secret, mfa_recovery_codes
     FROM admins
     WHERE id = $1
     LIMIT 1`,
    [payload.adminId]
  );
  if (rows.length === 0) throw new Error("Admin account not found");
  const row = rows[0] as Record<string, unknown>;
  if (!row.mfa_secret) throw new Error("MFA is not configured for this account");

  const secret = decryptMfaSecret(String(row.mfa_secret));
  if (!secret) throw new Error("Unable to read MFA secret for this account");

  let authorized = false;
  const mfaCode = payload.mfaCode?.trim() ?? "";
  if (mfaCode && verifyTotp(secret, mfaCode)) authorized = true;

  const storedCodes = Array.isArray(row.mfa_recovery_codes) ? (row.mfa_recovery_codes as string[]) : [];
  const recoveryCode = payload.recoveryCode?.trim().toUpperCase() ?? "";
  if (!authorized && recoveryCode) {
    authorized = storedCodes.some((entry) => entry === hashBackupCode(recoveryCode));
  }
  if (!authorized) throw new Error("MFA code or recovery code is required");

  const nextCodes = generateRecoveryCodes(10);
  await pool.query("UPDATE admins SET mfa_recovery_codes = $2 WHERE id = $1", [
    payload.adminId,
    nextCodes.map(hashBackupCode),
  ]);
  return { backupCodes: nextCodes };
}

export async function resetAdminMfa(targetAdminId: string): Promise<void> {
  await pool.query(
    `UPDATE admins
     SET mfa_enabled = false,
         mfa_secret = NULL,
         mfa_recovery_codes = '{}',
         mfa_reset_required = true
     WHERE id = $1`,
    [targetAdminId]
  );
  await pool.query("UPDATE admin_sessions SET revoked_at = COALESCE(revoked_at, now()) WHERE admin_id = $1", [targetAdminId]);
}

async function issueAdminToken(adminId: string, ttlSeconds: number): Promise<string> {
  const token = randomBytes(32).toString("hex");
  await pool.query(
    `INSERT INTO admin_auth_tokens (admin_id, token_type, token_hash, expires_at)
     VALUES ($1, 'password_reset', $2, now() + ($3::int * interval '1 second'))`,
    [adminId, hashToken(token), ttlSeconds]
  );
  return token;
}

async function consumeAdminToken(token: string): Promise<string | null> {
  const { rows } = await pool.query<{ admin_id: string }>(
    `UPDATE admin_auth_tokens
     SET used_at = now()
     WHERE token_hash = $1
       AND token_type = 'password_reset'
       AND used_at IS NULL
       AND expires_at > now()
     RETURNING admin_id`,
    [hashToken(token)]
  );
  return rows[0]?.admin_id ?? null;
}

export async function requestAdminPasswordReset(email: string): Promise<{ ok: boolean; resetToken?: string }> {
  const admin = await getAdminByEmail(email);
  if (!admin) return { ok: true };
  const token = await issueAdminToken(admin.id, config.resetTokenTtlSeconds);
  return {
    ok: true,
    resetToken: config.exposeDebugTokens ? token : undefined,
  };
}

export async function resetAdminPassword(token: string, password: string): Promise<void> {
  const adminId = await consumeAdminToken(token);
  if (!adminId) throw new Error("Invalid or expired password reset token");

  const hash = await hashPassword(password, config.passwordHashRounds);
  await pool.query(
    `UPDATE admins
     SET password_hash = $2,
         mfa_reset_required = true
     WHERE id = $1`,
    [adminId, hash]
  );
  await pool.query("UPDATE admin_sessions SET revoked_at = COALESCE(revoked_at, now()) WHERE admin_id = $1", [adminId]);
}
