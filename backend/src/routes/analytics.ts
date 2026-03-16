import { Router } from "express";
import { z } from "zod";
import { pool } from "../db/pool";
import { requireRole } from "../middleware/auth";

export const analyticsRouter = Router();

const AnalyticsEventSchema = z.object({
  eventName: z.string().min(1),
  sessionId: z.string().optional(),
  userEmail: z.string().email().optional(),
  payload: z.record(z.any()).optional(),
});

analyticsRouter.post("/events", async (req, res, next) => {
  try {
    const body = AnalyticsEventSchema.parse(req.body);
    await pool.query(
      `INSERT INTO analytics_events (event_name, session_id, user_email, payload)
       VALUES ($1,$2,$3,$4)`,
      [body.eventName, body.sessionId ?? null, body.userEmail ?? null, body.payload ?? null]
    );
    res.status(204).send();
  } catch (err) {
    next(err);
  }
});

analyticsRouter.get("/dashboard-summary", requireRole("viewer"), async (req, res, next) => {
  try {
    const days = z
      .string()
      .optional()
      .transform((value) => (value ? Number(value) : 30))
      .parse(req.query.days);
    const normalizedDays = Number.isFinite(days) ? Math.min(Math.max(Number(days), 1), 365) : 30;

    const windowStart = new Date(Date.now() - normalizedDays * 24 * 60 * 60 * 1000).toISOString();
    const params: unknown[] = [windowStart];

    const funnelRowsPromise = pool.query(
      `SELECT event_name, COUNT(*)::int AS total_events,
              COUNT(DISTINCT COALESCE(NULLIF(session_id, ''), id::text))::int AS sessions
       FROM analytics_events
       WHERE created_at >= $1::timestamptz
         AND event_name = ANY($2::text[])
       GROUP BY event_name`,
      [
        windowStart,
        ["product_view", "add_to_cart", "checkout_start", "purchase"],
      ]
    );

    const zeroResultSearchPromise = pool.query(
      `SELECT
        COALESCE(payload->>'query', '(empty)') AS query,
        COUNT(*)::int AS hits,
        MAX(created_at)::text AS last_seen
       FROM analytics_events
       WHERE created_at >= $1::timestamptz
         AND event_name = 'search_no_results'
       GROUP BY COALESCE(payload->>'query', '(empty)')
       ORDER BY hits DESC, last_seen DESC
       LIMIT 10`,
      params
    );

    const abandonedCartsPromise = pool.query(
      `SELECT
        COALESCE(currency, 'KES') AS currency,
        COUNT(*)::int AS open_carts,
        COALESCE(SUM(subtotal_cents), 0)::int AS subtotal_cents,
        MAX(last_seen)::text AS last_seen
       FROM abandoned_carts
       WHERE status = 'open'
       GROUP BY COALESCE(currency, 'KES')
       ORDER BY subtotal_cents DESC`
    );

    const outOfStockLossPromise = pool.query(
      `SELECT
        COALESCE(payload->>'currency', 'KES') AS currency,
        COUNT(*)::int AS events,
        COALESCE(
          SUM(
            CASE
              WHEN COALESCE(payload->>'priceCents', '') ~ '^[0-9]+$'
              THEN (payload->>'priceCents')::bigint
              ELSE 0
            END
          ),
          0
        )::bigint AS lost_revenue_cents
       FROM analytics_events
       WHERE created_at >= $1::timestamptz
         AND event_name = 'out_of_stock_impression'
       GROUP BY COALESCE(payload->>'currency', 'KES')
       ORDER BY lost_revenue_cents DESC`,
      params
    );

    const [funnelRows, zeroResultSearch, abandonedCarts, outOfStockLoss] = await Promise.all([
      funnelRowsPromise,
      zeroResultSearchPromise,
      abandonedCartsPromise,
      outOfStockLossPromise,
    ]);

    const byEvent = new Map(
      funnelRows.rows.map((row) => [
        row.event_name as string,
        {
          events: Number(row.total_events ?? 0),
          sessions: Number(row.sessions ?? 0),
        },
      ])
    );

    const views = byEvent.get("product_view")?.sessions ?? 0;
    const addToCart = byEvent.get("add_to_cart")?.sessions ?? 0;
    const checkout = byEvent.get("checkout_start")?.sessions ?? 0;
    const purchase = byEvent.get("purchase")?.sessions ?? 0;

    const conversionRate = (from: number, to: number) => {
      if (from <= 0) return 0;
      return Number(((to / from) * 100).toFixed(2));
    };

    const abandonedByCurrency = abandonedCarts.rows.map((row) => ({
      currency: String(row.currency ?? "KES").toUpperCase(),
      openCarts: Number(row.open_carts ?? 0),
      subtotalCents: Number(row.subtotal_cents ?? 0),
      lastSeen: row.last_seen ?? "",
    }));
    const abandonedTotal = abandonedByCurrency.reduce(
      (acc, row) => {
        acc.openCarts += row.openCarts;
        acc.subtotalCents += row.subtotalCents;
        if (!acc.lastSeen || (row.lastSeen && row.lastSeen > acc.lastSeen)) {
          acc.lastSeen = row.lastSeen;
        }
        return acc;
      },
      { openCarts: 0, subtotalCents: 0, lastSeen: "" }
    );

    const lostSalesByCurrency = outOfStockLoss.rows.map((row) => ({
      currency: String(row.currency ?? "KES").toUpperCase(),
      events: Number(row.events ?? 0),
      estimatedLostRevenueCents: Number(row.lost_revenue_cents ?? 0),
    }));
    const lostSalesTotal = lostSalesByCurrency.reduce(
      (acc, row) => {
        acc.events += row.events;
        acc.estimatedLostRevenueCents += row.estimatedLostRevenueCents;
        return acc;
      },
      { events: 0, estimatedLostRevenueCents: 0 }
    );

    res.json({
      windowDays: normalizedDays,
      funnel: [
        { stage: "Product Views", sessions: views, conversionPct: 100 },
        { stage: "Add to Cart", sessions: addToCart, conversionPct: conversionRate(views, addToCart) },
        { stage: "Checkout Start", sessions: checkout, conversionPct: conversionRate(addToCart, checkout) },
        { stage: "Purchases", sessions: purchase, conversionPct: conversionRate(checkout, purchase) },
      ],
      topSearchesNoResults: zeroResultSearch.rows.map((row) => ({
        query: row.query,
        hits: Number(row.hits ?? 0),
        lastSeen: row.last_seen,
      })),
      abandonedCarts: {
        openCarts: abandonedTotal.openCarts,
        subtotalCents: abandonedTotal.subtotalCents,
        lastSeen: abandonedTotal.lastSeen,
        byCurrency: abandonedByCurrency,
      },
      outOfStockLostSales: {
        events: lostSalesTotal.events,
        estimatedLostRevenueCents: lostSalesTotal.estimatedLostRevenueCents,
        byCurrency: lostSalesByCurrency,
      },
    });
  } catch (err) {
    next(err);
  }
});

analyticsRouter.get("/audit-logs", requireRole("super_admin"), async (req, res, next) => {
  try {
    const limit = z
      .string()
      .optional()
      .transform((value) => (value ? Number(value) : 100))
      .parse(req.query.limit);
    const normalizedLimit = Number.isFinite(limit) ? Math.min(Math.max(Number(limit), 1), 500) : 100;

    const { rows } = await pool.query(
      `SELECT
        l.id::text,
        l.admin_id::text AS actor_id,
        COALESCE(a.role, 'unknown') AS actor_role,
        l.action,
        l.target_type AS entity_type,
        l.target_id AS entity_id,
        l.metadata AS details,
        l.created_at::text
       FROM admin_audit_logs l
       LEFT JOIN admins a ON a.id = l.admin_id
       ORDER BY l.created_at DESC
       LIMIT $1`,
      [normalizedLimit]
    );

    res.json(
      rows.map((row) => ({
        id: row.id,
        actorId: row.actor_id ?? "",
        actorRole: row.actor_role ?? "",
        action: row.action,
        entityType: row.entity_type,
        entityId: row.entity_id ?? "",
        details: row.details ?? null,
        createdAt: row.created_at,
      }))
    );
  } catch (err) {
    next(err);
  }
});
