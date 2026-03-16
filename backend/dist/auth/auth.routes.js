import { Router } from "express";
import { login, logout, me, refresh, register, requestEmailVerification, requestPasswordReset, resetPassword, revokeSession, sessions, verifyEmail, } from "./auth.controller";
import { requireAuth } from "./auth.middleware";
export const authRouter = Router();
const customerAliasRouter = Router();
authRouter.post("/register", register);
authRouter.post("/login", login);
authRouter.post("/refresh", refresh);
authRouter.post("/logout", requireAuth({ domain: "customer" }), logout);
authRouter.get("/me", requireAuth({ domain: "customer" }), me);
authRouter.get("/sessions", requireAuth({ domain: "customer" }), sessions);
authRouter.delete("/sessions/:sessionId", requireAuth({ domain: "customer" }), revokeSession);
authRouter.post("/request-email-verification", requestEmailVerification);
authRouter.post("/verify-email", verifyEmail);
authRouter.post("/request-password-reset", requestPasswordReset);
authRouter.post("/reset-password", resetPassword);
customerAliasRouter.post("/register", register);
customerAliasRouter.post("/login", login);
customerAliasRouter.post("/refresh", refresh);
customerAliasRouter.post("/logout", requireAuth({ domain: "customer" }), logout);
customerAliasRouter.get("/me", requireAuth({ domain: "customer" }), me);
customerAliasRouter.get("/sessions", requireAuth({ domain: "customer" }), sessions);
customerAliasRouter.delete("/sessions/:sessionId", requireAuth({ domain: "customer" }), revokeSession);
customerAliasRouter.post("/request-email-verification", requestEmailVerification);
customerAliasRouter.post("/verify-email", verifyEmail);
customerAliasRouter.post("/request-password-reset", requestPasswordReset);
customerAliasRouter.post("/reset-password", resetPassword);
authRouter.use("/customer", customerAliasRouter);
authRouter.get("/", (req, res) => {
    const baseUrl = `${req.protocol}://${req.get("host") ?? "localhost:5000"}`;
    return res.json({
        customer: {
            register: `${baseUrl}/api/auth/register`,
            login: `${baseUrl}/api/auth/login`,
            refresh: `${baseUrl}/api/auth/refresh`,
            me: `${baseUrl}/api/auth/me`,
        },
        admin: {
            base: `${baseUrl}/api/admin/auth`,
            login: `${baseUrl}/api/admin/auth/login`,
            refresh: `${baseUrl}/api/admin/auth/refresh`,
            me: `${baseUrl}/api/admin/auth/me`,
        },
    });
});
