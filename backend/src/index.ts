import express from "express";
import cors from "cors";
import path from "node:path";
import fs from "node:fs";
import { randomUUID } from "node:crypto";
import { config, normalizeOrigin } from "./config";
import { productsRouter } from "./routes/products";
import { uploadsRouter } from "./routes/uploads";
import { shippingRouter } from "./routes/shipping";
import { ordersRouter } from "./routes/orders";
import { returnsRouter } from "./routes/returns";
import { analyticsRouter } from "./routes/analytics";
import { marketingRouter } from "./routes/marketing";
import { inventoryRouter } from "./routes/inventory";
import { seoRouter } from "./routes/seo";
import { settingsRouter } from "./routes/settings";
import { customerCareRouter } from "./routes/customerCare";
import { paymentsRouter } from "./routes/payments";
import { authRouter } from "./routes/auth";
import { adminAuthRouter } from "./admin/admin.routes";
import { usersRouter } from "./routes/users";
import { accountRouter } from "./routes/account";
import { quotesRouter } from "./routes/quotes";
import { createRateLimit } from "./middleware/rateLimit";
import { writeErrorLog } from "./lib/audit";

const app = express();

function isPrivateDevHost(origin: string): boolean {
  try {
    const { hostname } = new URL(origin);
    if (hostname === "localhost" || hostname === "127.0.0.1") return true;
    if (/^10\.\d{1,3}\.\d{1,3}\.\d{1,3}$/.test(hostname)) return true;
    if (/^192\.168\.\d{1,3}\.\d{1,3}$/.test(hostname)) return true;

    const match172 = hostname.match(/^172\.(\d{1,3})\.\d{1,3}\.\d{1,3}$/);
    if (!match172) return false;

    const secondOctet = Number(match172[1]);
    return secondOctet >= 16 && secondOctet <= 31;
  } catch {
    return false;
  }
}

app.use(
  cors({
    origin: (origin, cb) => {
      if (!origin) return cb(null, true);
      const normalizedOrigin = normalizeOrigin(origin);
      if (config.corsOrigins.length === 0) return cb(null, true);
      if (config.corsOrigins.includes(normalizedOrigin)) return cb(null, true);
      if (config.allowLocalhostCors && isPrivateDevHost(normalizedOrigin)) return cb(null, true);
      return cb(new Error(`CORS blocked for origin: ${origin}`));
    },
    credentials: true,
  })
);

app.use(express.json({ limit: "2mb" }));

app.use((req, res, next) => {
  const requestId = req.header("x-request-id") || randomUUID();
  res.locals.requestId = requestId;
  res.setHeader("x-request-id", requestId);
  next();
});

app.use(
  "/api/auth/login",
  createRateLimit({
    keyPrefix: "customer-login",
    windowMs: 60_000,
    max: 5,
  })
);
app.use(
  "/api/admin/auth/login",
  createRateLimit({
    keyPrefix: "admin-login",
    windowMs: 60_000,
    max: 5,
  })
);
app.use(
  "/api/auth/admin/login",
  createRateLimit({
    keyPrefix: "admin-login-legacy",
    windowMs: 60_000,
    max: 5,
  })
);
app.use(
  "/api/auth",
  createRateLimit({
    keyPrefix: "auth",
    windowMs: 60_000,
    max: 40,
  })
);
app.use(
  "/api",
  createRateLimit({
    keyPrefix: "api",
    windowMs: 60_000,
    max: 240,
  })
);
app.use(
  "/api/analytics/events",
  createRateLimit({
    keyPrefix: "analytics",
    windowMs: 60_000,
    max: 120,
  })
);
app.use(
  "/api/marketing/abandoned-cart",
  createRateLimit({
    keyPrefix: "marketing",
    windowMs: 60_000,
    max: 60,
  })
);

if (!fs.existsSync(config.uploadDir)) {
  fs.mkdirSync(config.uploadDir, { recursive: true });
}

app.use("/uploads", express.static(path.resolve(config.uploadDir)));

// Handle favicon.ico requests to prevent 404 errors
app.get("/favicon.ico", (_req, res) => {
  res.status(204).end(); // No Content response
});

app.get("/health", (_req, res) => res.json({ ok: true }));

app.use("/api/auth", authRouter);
app.use("/api/admin/auth", adminAuthRouter);
app.use("/api/auth/admin", adminAuthRouter);
app.use("/api/products", productsRouter);
app.use("/api/uploads", uploadsRouter);
app.use("/api/shipping", shippingRouter);
app.use("/api/orders", ordersRouter);
app.use("/api/returns", returnsRouter);
app.use("/api/analytics", analyticsRouter);
app.use("/api/marketing", marketingRouter);
app.use("/api/inventory", inventoryRouter);
app.use("/api/settings", settingsRouter);
app.use("/api/customer-care", customerCareRouter);
app.use("/api/payments", paymentsRouter);
app.use("/api/users", usersRouter);
app.use("/api/account", accountRouter);
app.use("/api/quotes", quotesRouter);
app.use("/", seoRouter);

// Error handler
app.use(async (err: unknown, req: express.Request, res: express.Response, _next: express.NextFunction) => {
  const message = err instanceof Error ? err.message : "Internal server error";
  const statusCode =
    typeof err === "object" &&
    err !== null &&
    "name" in err &&
    String((err as { name?: string }).name) === "ZodError"
      ? 400
      : 500;

  try {
    await writeErrorLog({
      requestId: res.locals.requestId as string | undefined,
      method: req.method,
      path: req.originalUrl,
      statusCode,
      message,
      stack: err instanceof Error ? err.stack : undefined,
    });
  } catch {
    // no-op
  }

  const errorLogLine = `[${req.method} ${req.originalUrl}] ${statusCode} ${message}${
    err instanceof Error && err.stack ? `\n${err.stack}` : ""
  }`;
  try {
    process.stderr.write(`${errorLogLine}\n`);
  } catch {
    // eslint-disable-next-line no-console
    console.error(`[${req.method} ${req.originalUrl}] ${statusCode} ${message}`);
  }
  res.status(statusCode).json({
    message: statusCode === 400 ? message : "Internal server error",
    requestId: res.locals.requestId as string | undefined,
  });
});

app.listen(config.port, () => {
  // eslint-disable-next-line no-console
  console.log(`Backend listening on http://localhost:${config.port}`);
});
