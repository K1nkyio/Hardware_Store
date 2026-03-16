import type { Request, Response } from "express";
import { z } from "zod";
import { getActor } from "./auth.middleware";
import {
  clearRefreshCookie,
  getSessionContext,
  listCustomerSessions,
  loginCustomer,
  readRefreshCookie,
  refreshCustomerSession,
  registerCustomer,
  requestCustomerEmailVerification,
  requestCustomerPasswordReset,
  resetCustomerPassword,
  revokeCustomerSession,
  setRefreshCookie,
  verifyCustomerEmail,
  logoutCustomer,
  getCustomerProfile,
} from "./auth.service";

const RegisterSchema = z.object({
  email: z.string().email(),
  username: z.string().trim().min(3).max(30).regex(/^[a-zA-Z0-9._-]+$/),
  password: z.string().min(8).max(128),
  fullName: z.string().min(1).max(120).optional(),
  phone: z.string().optional(),
  address: z.string().optional(),
});

const LoginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

const LogoutSchema = z.object({
  allSessions: z.boolean().optional(),
});

const TokenSchema = z.object({
  token: z.string().min(1),
});

const RequestTokenSchema = z.object({
  email: z.string().email().optional(),
});

const ResetPasswordSchema = z.object({
  token: z.string().min(1),
  password: z.string().min(8).max(128),
});

function statusForError(err: unknown): number {
  if (!(err instanceof Error)) return 500;
  const message = err.message.toLowerCase();
  if (message.includes("already exists")) return 409;
  if (message.includes("invalid email or password")) return 401;
  if (message.includes("locked")) return 423;
  if (message.includes("verify your email")) return 403;
  if (message.includes("disabled")) return 403;
  if (message.includes("refresh token")) return 401;
  if (message.includes("invalid or expired")) return 400;
  return 400;
}

export async function register(req: Request, res: Response, next: (err?: unknown) => void) {
  try {
    const body = RegisterSchema.parse(req.body);
    const result = await registerCustomer(body);
    return res.status(201).json({
      user: result.user,
      verificationRequired: true,
      verificationToken: result.verificationToken,
    });
  } catch (err) {
    const status = statusForError(err);
    if (status >= 400 && status < 500 && err instanceof Error) {
      return res.status(status).json({ message: err.message });
    }
    return next(err);
  }
}

export async function login(req: Request, res: Response, next: (err?: unknown) => void) {
  try {
    const body = LoginSchema.parse(req.body);
    const session = await loginCustomer(body, getSessionContext(req));
    setRefreshCookie(res, "customer", session.refreshToken);
    return res.json({
      user: session.user,
      accessToken: session.accessToken,
      accessTokenExpiresIn: session.accessTokenExpiresIn,
      refreshTokenExpiresIn: session.refreshTokenExpiresIn,
    });
  } catch (err) {
    const status = statusForError(err);
    if (status >= 400 && status < 500 && err instanceof Error) {
      return res.status(status).json({ message: err.message });
    }
    return next(err);
  }
}

export async function refresh(req: Request, res: Response, next: (err?: unknown) => void) {
  try {
    const refreshToken = readRefreshCookie(req, "customer");
    if (!refreshToken) return res.status(401).json({ message: "Refresh token cookie is missing" });
    const session = await refreshCustomerSession(refreshToken);
    setRefreshCookie(res, "customer", session.refreshToken);
    return res.json({
      user: session.user,
      accessToken: session.accessToken,
      accessTokenExpiresIn: session.accessTokenExpiresIn,
    });
  } catch (err) {
    clearRefreshCookie(res, "customer");
    const status = statusForError(err);
    if (status >= 400 && status < 500 && err instanceof Error) {
      return res.status(status).json({ message: err.message });
    }
    return next(err);
  }
}

export async function logout(req: Request, res: Response, next: (err?: unknown) => void) {
  try {
    const actor = getActor(req);
    const body = LogoutSchema.parse(req.body ?? {});
    if (actor.authenticated && actor.domain === "customer") {
      await logoutCustomer(actor.id, actor.sessionId, Boolean(body.allSessions));
    }
    clearRefreshCookie(res, "customer");
    return res.status(204).send();
  } catch (err) {
    return next(err);
  }
}

export async function me(req: Request, res: Response, next: (err?: unknown) => void) {
  try {
    const actor = getActor(req);
    const user = await getCustomerProfile(actor.id);
    if (!user) return res.status(404).json({ message: "Authenticated user was not found" });
    return res.json({ user, source: actor.source });
  } catch (err) {
    return next(err);
  }
}

export async function sessions(req: Request, res: Response, next: (err?: unknown) => void) {
  try {
    const actor = getActor(req);
    const payload = await listCustomerSessions(actor.id, actor.sessionId);
    return res.json(payload);
  } catch (err) {
    return next(err);
  }
}

export async function revokeSession(req: Request, res: Response, next: (err?: unknown) => void) {
  try {
    const actor = getActor(req);
    const sessionId = req.params.sessionId;
    await revokeCustomerSession(actor.id, sessionId);
    if (sessionId === actor.sessionId) {
      clearRefreshCookie(res, "customer");
    }
    return res.status(204).send();
  } catch (err) {
    return next(err);
  }
}

export async function requestEmailVerification(req: Request, res: Response, next: (err?: unknown) => void) {
  try {
    const body = RequestTokenSchema.parse(req.body ?? {});
    const actor = getActor(req);
    const result = await requestCustomerEmailVerification({
      actorUserId: actor.authenticated && actor.domain === "customer" ? actor.id : undefined,
      email: body.email,
    });
    return res.json(result);
  } catch (err) {
    return next(err);
  }
}

export async function verifyEmail(req: Request, res: Response, next: (err?: unknown) => void) {
  try {
    const body = TokenSchema.parse(req.body);
    await verifyCustomerEmail(body.token);
    return res.status(204).send();
  } catch (err) {
    const status = statusForError(err);
    if (status >= 400 && status < 500 && err instanceof Error) {
      return res.status(status).json({ message: err.message });
    }
    return next(err);
  }
}

export async function requestPasswordReset(req: Request, res: Response, next: (err?: unknown) => void) {
  try {
    const body = z.object({ email: z.string().email() }).parse(req.body);
    const result = await requestCustomerPasswordReset(body.email);
    return res.json(result);
  } catch (err) {
    return next(err);
  }
}

export async function resetPassword(req: Request, res: Response, next: (err?: unknown) => void) {
  try {
    const body = ResetPasswordSchema.parse(req.body);
    await resetCustomerPassword(body.token, body.password);
    return res.status(204).send();
  } catch (err) {
    const status = statusForError(err);
    if (status >= 400 && status < 500 && err instanceof Error) {
      return res.status(status).json({ message: err.message });
    }
    return next(err);
  }
}
