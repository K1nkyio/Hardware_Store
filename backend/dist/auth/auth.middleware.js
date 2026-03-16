import { config } from "../config";
import { verifyToken } from "../lib/authCrypto";
const roleWeight = {
    viewer: 1,
    manager: 2,
    super_admin: 3,
};
const rolePermissions = {
    viewer: new Set([]),
    manager: new Set(["products.price.edit", "moderation.manage", "inventory.adjust", "orders.manage"]),
    super_admin: new Set([
        "products.price.edit",
        "moderation.manage",
        "settings.manage",
        "inventory.adjust",
        "orders.manage",
        "audit.view",
        "mfa.reset",
        "admins.manage",
    ]),
};
function normalizeTokenRole(input) {
    const value = typeof input === "string" ? input.trim().toLowerCase() : "";
    if (value === "super_admin" || value === "super-admin")
        return "super_admin";
    if (value === "manager" || value === "admin")
        return "manager";
    if (value === "viewer")
        return "viewer";
    if (value === "customer" || value === "user")
        return "customer";
    return "anonymous";
}
function normalizeTokenDomain(input, role) {
    const value = typeof input === "string" ? input.trim().toLowerCase() : "";
    if (value === "admin")
        return "admin";
    if (role === "viewer" || role === "manager" || role === "super_admin")
        return "admin";
    return "customer";
}
function isAdminRole(role) {
    return role === "viewer" || role === "manager" || role === "super_admin";
}
function parseAccessToken(req) {
    const rawAuth = req.header("authorization");
    if (!rawAuth)
        return null;
    const [scheme, token] = rawAuth.split(" ");
    if (!scheme || !token || scheme.toLowerCase() !== "bearer")
        return null;
    try {
        const decoded = verifyToken(token, config.jwtAccessSecret);
        if (!decoded)
            return null;
        const payload = decoded;
        if (typeof payload.sub !== "string" || payload.sub.trim() === "")
            return null;
        const role = normalizeTokenRole(payload.role);
        if (role === "anonymous")
            return null;
        const domain = normalizeTokenDomain(payload.domain, role);
        if (domain === "admin") {
            const adminTypes = new Set(["admin", "admin_access", "access"]);
            if (payload.type && !adminTypes.has(payload.type))
                return null;
        }
        else if (payload.type && payload.type !== "access") {
            return null;
        }
        return payload;
    }
    catch {
        return null;
    }
}
export function getActor(req) {
    const tokenPayload = parseAccessToken(req);
    if (tokenPayload) {
        const role = normalizeTokenRole(tokenPayload.role);
        return {
            id: tokenPayload.sub,
            role,
            domain: normalizeTokenDomain(tokenPayload.domain, role),
            authenticated: true,
            source: "token",
            sessionId: tokenPayload.sid,
            email: typeof tokenPayload.email === "string" ? tokenPayload.email : undefined,
            name: typeof tokenPayload.name === "string" ? tokenPayload.name : undefined,
            mfaPending: tokenPayload.mfa === "pending",
        };
    }
    return {
        id: "anonymous",
        role: "anonymous",
        domain: "customer",
        authenticated: false,
        source: "anonymous",
        mfaPending: false,
    };
}
export function requireAuth(options) {
    return (req, res, next) => {
        const actor = getActor(req);
        if (!actor.authenticated) {
            return res.status(401).json({ message: "Authentication required" });
        }
        if (options?.domain && actor.domain !== options.domain) {
            return res.status(403).json({ message: `Requires ${options.domain} auth domain` });
        }
        if (!options?.allowMfaPending && actor.mfaPending) {
            return res.status(403).json({ message: "MFA setup is required before continuing" });
        }
        return next();
    };
}
export const requireAuthenticated = requireAuth;
export function requireAdmin(options) {
    return (req, res, next) => {
        const actor = getActor(req);
        if (!actor.authenticated || actor.domain !== "admin") {
            return res.status(401).json({ message: "Admin authentication required" });
        }
        if (!options?.allowMfaPending && actor.mfaPending) {
            return res.status(403).json({ message: "MFA setup is required before continuing" });
        }
        return next();
    };
}
export function requireRole(minRole) {
    return (req, res, next) => {
        const actor = getActor(req);
        if (!actor.authenticated || actor.domain !== "admin") {
            return res.status(401).json({ message: "Admin authentication required" });
        }
        if (actor.mfaPending) {
            return res.status(403).json({ message: "MFA setup is required before continuing" });
        }
        const required = roleWeight[minRole];
        const current = isAdminRole(actor.role) ? roleWeight[actor.role] : 0;
        if (current < required) {
            return res.status(403).json({
                message: `Requires role ${minRole} or higher`,
                currentRole: actor.role,
            });
        }
        return next();
    };
}
export function hasPermission(role, permission) {
    if (!isAdminRole(role))
        return false;
    return rolePermissions[role].has(permission);
}
export function requirePermission(permission) {
    return (req, res, next) => {
        const actor = getActor(req);
        if (!actor.authenticated || actor.domain !== "admin") {
            return res.status(401).json({ message: "Admin authentication required" });
        }
        if (actor.mfaPending) {
            return res.status(403).json({ message: "MFA setup is required before continuing" });
        }
        if (!hasPermission(actor.role, permission)) {
            return res.status(403).json({
                message: `Missing required permission: ${permission}`,
                currentRole: actor.role,
            });
        }
        return next();
    };
}
