const counters = new Map();
function buildRateKey(req, keyPrefix) {
    const ip = req.ip || req.socket.remoteAddress || "unknown";
    const routeKey = req.path || req.originalUrl || "/";
    return `${keyPrefix}:${ip}:${routeKey}`;
}
export function createRateLimit(options) {
    return (req, res, next) => {
        const now = Date.now();
        const key = buildRateKey(req, options.keyPrefix);
        const existing = counters.get(key);
        if (!existing || existing.resetAt <= now) {
            counters.set(key, { count: 1, resetAt: now + options.windowMs });
            return next();
        }
        if (existing.count >= options.max) {
            const retryAfterSeconds = Math.max(1, Math.ceil((existing.resetAt - now) / 1000));
            res.setHeader("Retry-After", retryAfterSeconds.toString());
            return res.status(429).json({ message: "Too many requests. Please retry shortly." });
        }
        existing.count += 1;
        counters.set(key, existing);
        return next();
    };
}
