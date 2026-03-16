import { Router } from "express";
import { z } from "zod";
import { pool } from "../db/pool";
import { writeAuditLog } from "../lib/audit";
import { getActor, requireRole } from "../middleware/auth";

export const ordersRouter = Router();
const LOW_STOCK_THRESHOLD = Number(process.env.LOW_STOCK_THRESHOLD ?? "5");

class HttpError extends Error {
  statusCode: number;

  constructor(statusCode: number, message: string) {
    super(message);
    this.statusCode = statusCode;
  }
}

const ORDER_STATUSES = [
  "pending",
  "processing",
  "ready_to_ship",
  "shipped",
  "delivered",
  "cancelled",
] as const;

const OrderStatusSchema = z.enum(ORDER_STATUSES);

const AddressSchema = z.object({
  address: z.string().min(1),
  city: z.string().min(1),
  postalCode: z.string().min(1),
  country: z.string().min(1),
});

const CreateOrderSchema = z.object({
  customer: z.object({
    email: z.string().email(),
    firstName: z.string().min(1),
    lastName: z.string().min(1),
    phone: z.string().optional(),
  }),
  items: z.array(
    z.object({
      productId: z.string().uuid(),
      quantity: z.number().int().positive(),
    })
  ),
  shippingMethod: z.string().optional(),
  shippingAddress: AddressSchema.optional(),
  billingAddress: AddressSchema.optional(),
  totals: z.object({
    taxCents: z.number().int().nonnegative(),
    shippingCents: z.number().int().nonnegative(),
  }),
  payment: z
    .object({
      method: z.enum(["card", "mpesa", "cod"]),
      provider: z.string().trim().min(1).max(80),
      txRef: z.string().trim().min(1).max(200),
      transactionId: z.string().trim().min(1).max(200),
      status: z.string().trim().min(1).max(40),
      amountCents: z.number().int().positive(),
      currency: z.string().trim().min(3).max(3),
      verifiedAt: z.string().datetime().optional(),
      metadata: z.record(z.any()).optional(),
    })
    .optional(),
});

const UpdateOrderSchema = z
  .object({
    status: OrderStatusSchema.optional(),
    notes: z.string().optional(),
    tags: z.array(z.string().trim().min(1)).optional(),
    trackingNumber: z.string().optional(),
    slaDueAt: z.string().datetime().optional(),
  })
  .refine((value) => Object.keys(value).length > 0, {
    message: "No fields provided for update",
  });

const MarkShippedSchema = z.object({
  trackingNumber: z.string().optional(),
});

ordersRouter.get("/", requireRole("viewer"), async (req, res, next) => {
  try {
    const status = typeof req.query.status === "string" ? req.query.status : undefined;
    const q = typeof req.query.q === "string" ? req.query.q.trim() : "";
    const limit = z
      .string()
      .optional()
      .transform((value) => (value ? Number(value) : 100))
      .parse(req.query.limit);

    const where: string[] = [];
    const params: unknown[] = [];

    if (status && ORDER_STATUSES.includes(status as (typeof ORDER_STATUSES)[number])) {
      params.push(status);
      where.push(`o.status = $${params.length}`);
    }

    if (q) {
      params.push(`%${q}%`);
      const idx = params.length;
      where.push(`(o.id::text ILIKE $${idx} OR o.customer_email ILIKE $${idx} OR o.customer_name ILIKE $${idx})`);
    }

    const normalizedLimit = Number.isFinite(limit) ? Math.min(Math.max(Number(limit), 1), 250) : 100;
    params.push(normalizedLimit);

    const whereSql = where.length > 0 ? `WHERE ${where.join(" AND ")}` : "";
    const rows = await pool.query(
      `SELECT
        o.id::text,
        o.customer_email,
        o.customer_name,
        o.customer_phone,
        o.status,
        o.payment_method,
        o.payment_provider,
        o.payment_reference,
        o.payment_status,
        o.currency,
        o.subtotal_cents,
        o.tax_cents,
        o.shipping_cents,
        o.total_cents,
        o.shipping_method,
        o.shipping_address,
        o.billing_address,
        o.notes,
        o.tags,
        o.sla_due_at::text,
        o.shipped_at::text,
        o.tracking_number,
        o.created_at::text,
        o.updated_at::text,
        COALESCE(SUM(oi.quantity), 0) AS item_count
      FROM orders o
      LEFT JOIN order_items oi ON oi.order_id = o.id
      ${whereSql}
      GROUP BY o.id
      ORDER BY o.created_at DESC
      LIMIT $${params.length}`,
      params
    );

    const pipelineRows = await pool.query(
      `SELECT status, COUNT(*)::int AS count
       FROM orders
       GROUP BY status`
    );

    const pipeline = ORDER_STATUSES.map((entry) => ({
      status: entry,
      count: Number(
        pipelineRows.rows.find((row) => String(row.status) === entry)?.count ?? 0
      ),
    }));

    const items = rows.rows.map((row) => ({
      id: row.id,
      customerEmail: row.customer_email,
      customerName: row.customer_name,
      customerPhone: row.customer_phone ?? "",
      status: row.status,
      paymentMethod: row.payment_method ?? "",
      paymentProvider: row.payment_provider ?? "",
      paymentReference: row.payment_reference ?? "",
      paymentStatus: row.payment_status ?? "pending",
      currency: row.currency,
      subtotalCents: Number(row.subtotal_cents),
      taxCents: Number(row.tax_cents),
      shippingCents: Number(row.shipping_cents),
      totalCents: Number(row.total_cents),
      shippingMethod: row.shipping_method ?? "",
      shippingAddress: row.shipping_address ?? null,
      billingAddress: row.billing_address ?? null,
      notes: row.notes ?? "",
      tags: Array.isArray(row.tags) ? row.tags : [],
      slaDueAt: row.sla_due_at ?? "",
      shippedAt: row.shipped_at ?? "",
      trackingNumber: row.tracking_number ?? "",
      itemCount: Number(row.item_count ?? 0),
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    }));

    res.json({ items, pipeline });
  } catch (err) {
    next(err);
  }
});

ordersRouter.get("/:id", requireRole("viewer"), async (req, res, next) => {
  try {
    const id = req.params.id;
    const orderRows = await pool.query(
      `SELECT
        id::text,
        customer_email,
        customer_name,
        customer_phone,
        status,
        payment_method,
        payment_provider,
        payment_reference,
        payment_status,
        payment_metadata,
        currency,
        subtotal_cents,
        tax_cents,
        shipping_cents,
        total_cents,
        shipping_method,
        shipping_address,
        billing_address,
        notes,
        tags,
        sla_due_at::text,
        shipped_at::text,
        tracking_number,
        created_at::text,
        updated_at::text
      FROM orders
      WHERE id = $1`,
      [id]
    );
    if (orderRows.rowCount === 0) return res.status(404).json({ message: "Order not found" });

    const itemRows = await pool.query(
      `SELECT
        id::text,
        product_id::text,
        product_name,
        sku,
        quantity,
        price_cents,
        currency,
        backordered,
        backorder_eta_days
      FROM order_items
      WHERE order_id = $1
      ORDER BY id`,
      [id]
    );

    const order = orderRows.rows[0];
    res.json({
      id: order.id,
      customerEmail: order.customer_email,
      customerName: order.customer_name,
      customerPhone: order.customer_phone ?? "",
      status: order.status,
      paymentMethod: order.payment_method ?? "",
      paymentProvider: order.payment_provider ?? "",
      paymentReference: order.payment_reference ?? "",
      paymentStatus: order.payment_status ?? "pending",
      paymentMetadata: order.payment_metadata ?? null,
      currency: order.currency,
      subtotalCents: Number(order.subtotal_cents),
      taxCents: Number(order.tax_cents),
      shippingCents: Number(order.shipping_cents),
      totalCents: Number(order.total_cents),
      shippingMethod: order.shipping_method ?? "",
      shippingAddress: order.shipping_address ?? null,
      billingAddress: order.billing_address ?? null,
      notes: order.notes ?? "",
      tags: Array.isArray(order.tags) ? order.tags : [],
      slaDueAt: order.sla_due_at ?? "",
      shippedAt: order.shipped_at ?? "",
      trackingNumber: order.tracking_number ?? "",
      createdAt: order.created_at,
      updatedAt: order.updated_at,
      items: itemRows.rows.map((item) => ({
        id: item.id,
        productId: item.product_id,
        productName: item.product_name,
        sku: item.sku ?? "",
        quantity: Number(item.quantity),
        priceCents: Number(item.price_cents),
        currency: item.currency,
        backordered: Boolean(item.backordered),
        backorderEtaDays:
          typeof item.backorder_eta_days === "number" ? item.backorder_eta_days : null,
      })),
    });
  } catch (err) {
    next(err);
  }
});

ordersRouter.get("/:id/invoice", requireRole("viewer"), async (req, res, next) => {
  try {
    const id = req.params.id;
    const orderRows = await pool.query(
      `SELECT
        id::text,
        customer_email,
        customer_name,
        customer_phone,
        status,
        payment_method,
        payment_provider,
        payment_reference,
        payment_status,
        currency,
        subtotal_cents,
        tax_cents,
        shipping_cents,
        total_cents,
        shipping_method,
        shipping_address,
        billing_address,
        created_at::text
      FROM orders
      WHERE id = $1`,
      [id]
    );

    if (orderRows.rowCount === 0) return res.status(404).json({ message: "Order not found" });

    const itemRows = await pool.query(
      `SELECT product_name, sku, quantity, price_cents, currency
       FROM order_items
       WHERE order_id = $1
       ORDER BY id`,
      [id]
    );

    const order = orderRows.rows[0];
    res.json({
      invoiceNumber: `INV-${String(order.id).slice(0, 8).toUpperCase()}`,
      issuedAt: new Date().toISOString(),
      order: {
        id: order.id,
        createdAt: order.created_at,
        status: order.status,
        paymentMethod: order.payment_method ?? "",
        paymentProvider: order.payment_provider ?? "",
        paymentReference: order.payment_reference ?? "",
        paymentStatus: order.payment_status ?? "pending",
        customerName: order.customer_name,
        customerEmail: order.customer_email,
        customerPhone: order.customer_phone ?? "",
        currency: order.currency,
        subtotalCents: Number(order.subtotal_cents),
        taxCents: Number(order.tax_cents),
        shippingCents: Number(order.shipping_cents),
        totalCents: Number(order.total_cents),
        shippingMethod: order.shipping_method ?? "",
        shippingAddress: order.shipping_address ?? null,
        billingAddress: order.billing_address ?? null,
      },
      items: itemRows.rows.map((item) => ({
        productName: item.product_name,
        sku: item.sku ?? "",
        quantity: Number(item.quantity),
        priceCents: Number(item.price_cents),
        currency: item.currency,
      })),
    });
  } catch (err) {
    next(err);
  }
});

ordersRouter.patch("/:id", requireRole("manager"), async (req, res, next) => {
  try {
    const id = req.params.id;
    const body = UpdateOrderSchema.parse(req.body);
    const actor = getActor(req);

    const normalizedTags =
      body.tags?.map((tag) => tag.trim()).filter(Boolean).slice(0, 25) ?? null;
    const slaDueAt = body.slaDueAt ? new Date(body.slaDueAt).toISOString() : null;
    const status = body.status ?? null;
    const trackingNumber = body.trackingNumber?.trim() ?? null;

    const { rows } = await pool.query(
      `UPDATE orders
       SET
        status = COALESCE($2, status),
        notes = COALESCE($3, notes),
        tags = COALESCE($4, tags),
        sla_due_at = COALESCE($5::timestamptz, sla_due_at),
        tracking_number = COALESCE($6, tracking_number),
        shipped_at = CASE
          WHEN COALESCE($2, status) = 'shipped' AND shipped_at IS NULL THEN now()
          WHEN COALESCE($2, status) <> 'shipped' THEN NULL
          ELSE shipped_at
        END
       WHERE id = $1
       RETURNING id::text, status, notes, tags, sla_due_at::text, shipped_at::text, tracking_number, updated_at::text`,
      [
        id,
        status,
        body.notes ?? null,
        normalizedTags,
        slaDueAt,
        trackingNumber,
      ]
    );

    if (rows.length === 0) return res.status(404).json({ message: "Order not found" });

    const updated = rows[0];
    await writeAuditLog({
      actorId: actor.id,
      actorRole: actor.role,
      action: "order.updated",
      entityType: "order",
      entityId: updated.id,
      details: {
        status: updated.status,
        tags: updated.tags ?? [],
        trackingNumber: updated.tracking_number ?? "",
        slaDueAt: updated.sla_due_at ?? "",
      },
    });

    res.json({
      id: updated.id,
      status: updated.status,
      notes: updated.notes ?? "",
      tags: Array.isArray(updated.tags) ? updated.tags : [],
      slaDueAt: updated.sla_due_at ?? "",
      shippedAt: updated.shipped_at ?? "",
      trackingNumber: updated.tracking_number ?? "",
      updatedAt: updated.updated_at,
    });
  } catch (err) {
    next(err);
  }
});

ordersRouter.post("/:id/mark-shipped", requireRole("manager"), async (req, res, next) => {
  try {
    const id = req.params.id;
    const body = MarkShippedSchema.parse(req.body);
    const actor = getActor(req);

    const { rows } = await pool.query(
      `UPDATE orders
       SET status = 'shipped',
           shipped_at = now(),
           tracking_number = COALESCE($2, tracking_number)
       WHERE id = $1
       RETURNING id::text, status, shipped_at::text, tracking_number, updated_at::text`,
      [id, body.trackingNumber?.trim() || null]
    );

    if (rows.length === 0) return res.status(404).json({ message: "Order not found" });

    await writeAuditLog({
      actorId: actor.id,
      actorRole: actor.role,
      action: "order.mark_shipped",
      entityType: "order",
      entityId: rows[0].id,
      details: { trackingNumber: rows[0].tracking_number ?? "" },
    });

    res.json({
      id: rows[0].id,
      status: rows[0].status,
      shippedAt: rows[0].shipped_at,
      trackingNumber: rows[0].tracking_number ?? "",
      updatedAt: rows[0].updated_at,
    });
  } catch (err) {
    next(err);
  }
});

ordersRouter.post("/", async (req, res, next) => {
  const client = await pool.connect();
  try {
    const body = CreateOrderSchema.parse(req.body);
    if (body.items.length === 0) {
      return res.status(400).json({ message: "Order must include items." });
    }

    await client.query("BEGIN");

    const ids = body.items.map((item) => item.productId);
    const uniqueIds = Array.from(new Set(ids));
    const { rows } = await client.query(
      `SELECT id, name, sku, price_cents, currency, stock, backorderable, backorder_eta_days, reorder_threshold
       FROM products
       WHERE id = ANY($1::uuid[])
       FOR UPDATE`,
      [uniqueIds]
    );

    if (rows.length !== uniqueIds.length) {
      const found = new Set(rows.map((row) => String(row.id)));
      const missingIds = uniqueIds.filter((id) => !found.has(id));
      throw new HttpError(
        409,
        `Some products are unavailable: ${missingIds.map((id) => id.slice(0, 8)).join(", ")}`
      );
    }

    const productMap = new Map(
      rows.map((row) => [
        row.id,
        {
          name: row.name,
          sku: row.sku,
          priceCents: Number(row.price_cents),
          currency: row.currency,
          stock: Number(row.stock),
          backorderable: Boolean(row.backorderable),
          backorderEtaDays:
            typeof row.backorder_eta_days === "number" ? row.backorder_eta_days : null,
          reorderThreshold:
            typeof row.reorder_threshold === "number" ? row.reorder_threshold : LOW_STOCK_THRESHOLD,
        },
      ])
    );

    const currency = rows[0].currency;
    let subtotalCents = 0;
    const orderItems: {
      productId: string;
      productName: string;
      sku: string | null;
      quantity: number;
      priceCents: number;
      currency: string;
      backordered: boolean;
      backorderEtaDays: number | null;
    }[] = [];

    for (const item of body.items) {
      const product = productMap.get(item.productId);
      if (!product) {
        throw new HttpError(409, "Some products are unavailable. Please refresh your cart.");
      }

      if (product.currency !== currency) {
        throw new HttpError(
          400,
          "Mixed currencies are not supported in one checkout. Please separate your order by currency."
        );
      }

      let backordered = false;
      if (product.stock < item.quantity) {
        if (!product.backorderable) {
          throw new HttpError(409, `${product.name} is out of stock.`);
        }
        backordered = true;
      }

      const remainingStock = Math.max(0, product.stock - item.quantity);

      await client.query("UPDATE products SET stock = $1 WHERE id = $2", [
        remainingStock,
        item.productId,
      ]);

      await client.query(
        `INSERT INTO stock_movements (product_id, movement_type, quantity, previous_stock, next_stock, reason, performed_by, metadata)
         VALUES ($1, 'out', $2, $3, $4, $5, $6, $7)`,
        [
          item.productId,
          item.quantity,
          product.stock,
          remainingStock,
          "Order checkout deduction",
          "checkout",
          JSON.stringify({ source: "order", tentative: true }),
        ]
      );

      if (remainingStock <= product.reorderThreshold) {
        const existingAlert = await client.query(
          "SELECT id FROM inventory_alerts WHERE product_id = $1 AND resolved_at IS NULL LIMIT 1",
          [item.productId]
        );
        if (existingAlert.rowCount === 0) {
          await client.query(
            `INSERT INTO inventory_alerts (product_id, stock_level, threshold)
             VALUES ($1, $2, $3)`,
            [item.productId, remainingStock, product.reorderThreshold]
          );
        }
      }

      subtotalCents += product.priceCents * item.quantity;
      orderItems.push({
        productId: item.productId,
        productName: product.name,
        sku: product.sku,
        quantity: item.quantity,
        priceCents: product.priceCents,
        currency: product.currency,
        backordered,
        backorderEtaDays: backordered ? product.backorderEtaDays ?? null : null,
      });
    }

    const totalCents = subtotalCents + body.totals.taxCents + body.totals.shippingCents;
    const customerName = `${body.customer.firstName} ${body.customer.lastName}`.trim();
    const slaDueAt = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString();
    const normalizedPaymentCurrency = body.payment?.currency?.toUpperCase();
    const normalizedPaymentStatus = body.payment?.status?.toLowerCase();

    if (body.payment) {
      if (normalizedPaymentStatus !== "successful") {
        throw new HttpError(400, "Online payment must be successful before placing the order.");
      }

      if (body.payment.amountCents !== totalCents) {
        throw new HttpError(400, "Paid amount does not match the current order total.");
      }

      if (normalizedPaymentCurrency !== currency.toUpperCase()) {
        throw new HttpError(400, "Paid currency does not match the order currency.");
      }
    }

    const { rows: orderRows } = await client.query(
      `INSERT INTO orders (
        customer_email, customer_name, customer_phone, status,
        payment_method, payment_provider, payment_reference, payment_status, payment_metadata,
        currency, subtotal_cents, tax_cents, shipping_cents, total_cents,
        shipping_method, shipping_address, billing_address, sla_due_at
      )
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18::timestamptz)
       RETURNING id, created_at::text`,
      [
        body.customer.email,
        customerName,
        body.customer.phone ?? null,
        "pending",
        body.payment?.method ?? null,
        body.payment?.provider ?? null,
        body.payment?.txRef ?? null,
        normalizedPaymentStatus ?? "pending",
        body.payment
          ? {
              transactionId: body.payment.transactionId,
              verifiedAt: body.payment.verifiedAt ?? new Date().toISOString(),
              metadata: body.payment.metadata ?? {},
            }
          : null,
        currency,
        subtotalCents,
        body.totals.taxCents,
        body.totals.shippingCents,
        totalCents,
        body.shippingMethod ?? null,
        body.shippingAddress ?? null,
        body.billingAddress ?? null,
        slaDueAt,
      ]
    );

    const orderId = orderRows[0].id as string;

    for (const item of orderItems) {
      await client.query(
        `INSERT INTO order_items (order_id, product_id, product_name, sku, quantity, price_cents, currency, backordered, backorder_eta_days)
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9)`,
        [
          orderId,
          item.productId,
          item.productName,
          item.sku ?? null,
          item.quantity,
          item.priceCents,
          item.currency,
          item.backordered,
          item.backorderEtaDays,
        ]
      );
    }

    await client.query("COMMIT");

    res.status(201).json({
      id: orderId,
      currency,
      paymentStatus: normalizedPaymentStatus ?? "pending",
      paymentMethod: body.payment?.method ?? "",
      paymentReference: body.payment?.txRef ?? "",
      subtotalCents,
      taxCents: body.totals.taxCents,
      shippingCents: body.totals.shippingCents,
      totalCents,
      items: orderItems,
    });
  } catch (err) {
    await client.query("ROLLBACK");
    if (err instanceof HttpError) {
      return res.status(err.statusCode).json({ message: err.message });
    }
    next(err);
  } finally {
    client.release();
  }
});
