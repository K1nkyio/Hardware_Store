import { z } from "zod";
import { writeAuditLog } from "../lib/audit";
import { getActor } from "../auth/auth.middleware";
import { activateAdminMfa, clearRefreshCookie, getAdminProfile, getSessionContext, listAdminSessions, loginAdmin, logoutAdmin, readRefreshCookie, refreshAdminSession, registerAdmin, regenerateAdminRecoveryCodes, requestAdminPasswordReset, resetAdminMfa, resetAdminPassword, revokeAdminSession, seedSuperAdmin, setRefreshCookie, setupAdminMfa, } from "../auth/auth.service";
const RegisterAdminSchema = z.object({
    email: z.string().email(),
    password: z.string().min(8).max(128),
    fullName: z.string().min(1).max(120),
    role: z.enum(["viewer", "manager", "super_admin"]).default("viewer"),
});
const LoginSchema = z.object({
    email: z.string().email(),
    password: z.string().min(1),
    mfaCode: z
        .string()
        .trim()
        .regex(/^\d{6}$/)
        .optional(),
    recoveryCode: z.string().trim().min(4).max(64).optional(),
});
const LogoutSchema = z.object({
    allSessions: z.boolean().optional(),
});
const ActivateMfaSchema = z.object({
    code: z
        .string()
        .trim()
        .regex(/^\d{6}$/),
});
const RegenerateRecoveryCodesSchema = z.object({
    mfaCode: z
        .string()
        .trim()
        .regex(/^\d{6}$/)
        .optional(),
    recoveryCode: z.string().trim().min(4).max(64).optional(),
});
const ResetAdminMfaSchema = z.object({
    adminId: z.string().uuid(),
    reason: z.string().trim().min(8).max(500),
});
const ResetPasswordSchema = z.object({
    token: z.string().min(1),
    password: z.string().min(8).max(128),
});
function statusForError(err) {
    if (!(err instanceof Error))
        return 500;
    const message = err.message.toLowerCase();
    if (message.includes("already exists"))
        return 409;
    if (message.includes("invalid email or password"))
        return 401;
    if (message.includes("locked"))
        return 423;
    if (message.includes("disabled"))
        return 403;
    if (message.includes("refresh token"))
        return 401;
    if (message.includes("mfa"))
        return 401;
    if (message.includes("invalid or expired"))
        return 400;
    return 400;
}
export async function seed(req, res, next) {
    try {
        const body = RegisterAdminSchema.parse({ ...req.body, role: "super_admin" });
        const session = await seedSuperAdmin(body, getSessionContext(req));
        setRefreshCookie(res, "admin", session.refreshToken);
        return res.status(201).json({
            user: session.user,
            accessToken: session.accessToken,
            accessTokenExpiresIn: session.accessTokenExpiresIn,
            refreshTokenExpiresIn: session.refreshTokenExpiresIn,
            mfaSetupRequired: session.mfaSetupRequired,
        });
    }
    catch (err) {
        const status = statusForError(err);
        if (status >= 400 && status < 500 && err instanceof Error) {
            return res.status(status).json({ message: err.message });
        }
        return next(err);
    }
}
export async function register(req, res, next) {
    try {
        const actor = getActor(req);
        const body = RegisterAdminSchema.parse(req.body);
        const user = await registerAdmin(body);
        await writeAuditLog({
            actorId: actor.id,
            actorRole: actor.role,
            action: "auth.admin_created",
            entityType: "admin",
            entityId: user.id,
            details: { role: user.role },
        });
        return res.status(201).json({ user });
    }
    catch (err) {
        const status = statusForError(err);
        if (status >= 400 && status < 500 && err instanceof Error) {
            return res.status(status).json({ message: err.message });
        }
        return next(err);
    }
}
export async function login(req, res, next) {
    try {
        const body = LoginSchema.parse(req.body);
        const session = await loginAdmin(body, getSessionContext(req));
        setRefreshCookie(res, "admin", session.refreshToken);
        return res.json({
            user: session.user,
            accessToken: session.accessToken,
            accessTokenExpiresIn: session.accessTokenExpiresIn,
            refreshTokenExpiresIn: session.refreshTokenExpiresIn,
            mfaSetupRequired: session.mfaSetupRequired,
        });
    }
    catch (err) {
        const status = statusForError(err);
        if (status >= 400 && status < 500 && err instanceof Error) {
            return res.status(status).json({ message: err.message });
        }
        return next(err);
    }
}
export async function refresh(req, res, next) {
    try {
        const refreshToken = readRefreshCookie(req, "admin");
        if (!refreshToken)
            return res.status(401).json({ message: "Refresh token cookie is missing" });
        const session = await refreshAdminSession(refreshToken);
        setRefreshCookie(res, "admin", session.refreshToken);
        return res.json({
            user: session.user,
            accessToken: session.accessToken,
            accessTokenExpiresIn: session.accessTokenExpiresIn,
            mfaSetupRequired: session.mfaSetupRequired,
        });
    }
    catch (err) {
        clearRefreshCookie(res, "admin");
        const status = statusForError(err);
        if (status >= 400 && status < 500 && err instanceof Error) {
            return res.status(status).json({ message: err.message });
        }
        return next(err);
    }
}
export async function logout(req, res, next) {
    try {
        const actor = getActor(req);
        const body = LogoutSchema.parse(req.body ?? {});
        if (actor.authenticated && actor.domain === "admin") {
            await logoutAdmin(actor.id, actor.sessionId, Boolean(body.allSessions));
        }
        clearRefreshCookie(res, "admin");
        return res.status(204).send();
    }
    catch (err) {
        return next(err);
    }
}
export async function me(req, res, next) {
    try {
        const actor = getActor(req);
        const user = await getAdminProfile(actor.id);
        if (!user)
            return res.status(404).json({ message: "Authenticated user was not found" });
        return res.json({ user, source: actor.source, mfaPending: actor.mfaPending });
    }
    catch (err) {
        return next(err);
    }
}
export async function sessions(req, res, next) {
    try {
        const actor = getActor(req);
        return res.json(await listAdminSessions(actor.id, actor.sessionId));
    }
    catch (err) {
        return next(err);
    }
}
export async function revokeSession(req, res, next) {
    try {
        const actor = getActor(req);
        await revokeAdminSession(actor.id, req.params.sessionId);
        if (req.params.sessionId === actor.sessionId) {
            clearRefreshCookie(res, "admin");
        }
        return res.status(204).send();
    }
    catch (err) {
        return next(err);
    }
}
export async function mfaSetup(req, res, next) {
    try {
        const actor = getActor(req);
        if (!actor.mfaPending)
            return res.status(400).json({ message: "MFA setup is not pending for this session" });
        const result = await setupAdminMfa(actor.id, actor.email ?? actor.id);
        return res.json(result);
    }
    catch (err) {
        const status = statusForError(err);
        if (status >= 400 && status < 500 && err instanceof Error) {
            return res.status(status).json({ message: err.message });
        }
        return next(err);
    }
}
export async function mfaActivate(req, res, next) {
    try {
        const actor = getActor(req);
        if (!actor.mfaPending)
            return res.status(400).json({ message: "MFA setup is not pending for this session" });
        const body = ActivateMfaSchema.parse(req.body);
        const session = await activateAdminMfa(actor.id, actor.sessionId, body.code, getSessionContext(req));
        setRefreshCookie(res, "admin", session.refreshToken);
        return res.json({
            user: session.user,
            accessToken: session.accessToken,
            accessTokenExpiresIn: session.accessTokenExpiresIn,
            refreshTokenExpiresIn: session.refreshTokenExpiresIn,
            mfaSetupRequired: false,
        });
    }
    catch (err) {
        const status = statusForError(err);
        if (status >= 400 && status < 500 && err instanceof Error) {
            return res.status(status).json({ message: err.message });
        }
        return next(err);
    }
}
export async function mfaRegenerateRecoveryCodes(req, res, next) {
    try {
        const actor = getActor(req);
        const body = RegenerateRecoveryCodesSchema.parse(req.body ?? {});
        return res.json(await regenerateAdminRecoveryCodes({
            adminId: actor.id,
            mfaCode: body.mfaCode,
            recoveryCode: body.recoveryCode,
        }));
    }
    catch (err) {
        const status = statusForError(err);
        if (status >= 400 && status < 500 && err instanceof Error) {
            return res.status(status).json({ message: err.message });
        }
        return next(err);
    }
}
export async function mfaReset(req, res, next) {
    try {
        const actor = getActor(req);
        const body = ResetAdminMfaSchema.parse(req.body);
        await resetAdminMfa(body.adminId);
        await writeAuditLog({
            actorId: actor.id,
            actorRole: actor.role,
            action: "auth.mfa_reset",
            entityType: "admin",
            entityId: body.adminId,
            details: { reason: body.reason },
        });
        return res.status(204).send();
    }
    catch (err) {
        return next(err);
    }
}
export async function requestPasswordReset(req, res, next) {
    try {
        const body = z.object({ email: z.string().email() }).parse(req.body);
        return res.json(await requestAdminPasswordReset(body.email));
    }
    catch (err) {
        return next(err);
    }
}
export async function resetPassword(req, res, next) {
    try {
        const body = ResetPasswordSchema.parse(req.body);
        await resetAdminPassword(body.token, body.password);
        return res.status(204).send();
    }
    catch (err) {
        const status = statusForError(err);
        if (status >= 400 && status < 500 && err instanceof Error) {
            return res.status(status).json({ message: err.message });
        }
        return next(err);
    }
}
