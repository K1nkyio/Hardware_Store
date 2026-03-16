import { Router } from "express";
import { z } from "zod";
import { pool } from "../db/pool";
import { getActor, requireRole } from "../middleware/auth";
import { writeAuditLog } from "../lib/audit";

export const inventoryRouter = Router();

inventoryRouter.get("/low-stock", requireRole("viewer"), async (req, res, next) => {
  try {
    const threshold = z
      .string()
      .optional()
      .transform((value) => (value ? Number(value) : undefined))
      .parse(req.query.threshold);
    const limit = z
      .string()
      .optional()
      .transform((value) => (value ? Number(value) : 50))
      .parse(req.query.limit);

    const normalizedThreshold = Number.isFinite(threshold) ? Number(threshold) : null;
    const normalizedLimit = Number.isFinite(limit) ? Math.min(Math.max(Number(limit), 1), 250) : 50;

    const { rows } = await pool.query(
      `SELECT id::text, name, sku, stock, reorder_threshold
       FROM products
       WHERE stock <= COALESCE($1::int, reorder_threshold)
       ORDER BY stock ASC
       LIMIT $2`,
      [normalizedThreshold, normalizedLimit]
    );

    res.json({
      thresholdOverride: normalizedThreshold,
      items: rows.map((row) => ({
        id: row.id,
        name: row.name,
        sku: row.sku ?? "",
        stock: Number(row.stock),
        reorderThreshold: Number(row.reorder_threshold ?? 10),
      })),
    });
  } catch (err) {
    next(err);
  }
});

inventoryRouter.get("/overview", requireRole("viewer"), async (_req, res, next) => {
  try {
    const productStatsPromise = pool.query(
      `SELECT
        COUNT(*)::int AS total_products,
        COUNT(*) FILTER (WHERE stock <= 0)::int AS out_of_stock,
        COUNT(*) FILTER (WHERE stock > 0 AND stock <= reorder_threshold)::int AS low_stock
      FROM products`
    );
    const lowStockPromise = pool.query(
      `SELECT id::text, name, sku, stock, reorder_threshold, updated_at::text
       FROM products
       WHERE stock <= reorder_threshold
       ORDER BY stock ASC
       LIMIT 25`
    );
    const supplierStatsPromise = pool.query(
      `SELECT COUNT(*)::int AS total_suppliers,
              COUNT(*) FILTER (WHERE is_active = true)::int AS active_suppliers
       FROM suppliers`
    );
    const movementPromise = pool.query(
      `SELECT m.id::text, m.product_id::text, p.name AS product_name, p.sku,
              m.movement_type, m.quantity, m.previous_stock, m.next_stock,
              m.reason, m.performed_by, m.created_at::text
       FROM stock_movements m
       INNER JOIN products p ON p.id = m.product_id
       ORDER BY m.created_at DESC
       LIMIT 30`
    );

    const [productStats, lowStock, supplierStats, movements] = await Promise.all([
      productStatsPromise,
      lowStockPromise,
      supplierStatsPromise,
      movementPromise,
    ]);

    res.json({
      summary: {
        totalProducts: Number(productStats.rows[0]?.total_products ?? 0),
        outOfStock: Number(productStats.rows[0]?.out_of_stock ?? 0),
        lowStock: Number(productStats.rows[0]?.low_stock ?? 0),
        totalSuppliers: Number(supplierStats.rows[0]?.total_suppliers ?? 0),
        activeSuppliers: Number(supplierStats.rows[0]?.active_suppliers ?? 0),
      },
      lowStockItems: lowStock.rows.map((row) => ({
        id: row.id,
        name: row.name,
        sku: row.sku ?? "",
        stock: Number(row.stock),
        reorderThreshold: Number(row.reorder_threshold ?? 10),
        updatedAt: row.updated_at,
      })),
      recentMovements: movements.rows.map((row) => ({
        id: row.id,
        productId: row.product_id,
        productName: row.product_name,
        sku: row.sku ?? "",
        movementType: row.movement_type,
        quantity: Number(row.quantity),
        previousStock: Number(row.previous_stock),
        nextStock: Number(row.next_stock),
        reason: row.reason ?? "",
        performedBy: row.performed_by ?? "",
        createdAt: row.created_at,
      })),
    });
  } catch (err) {
    next(err);
  }
});

inventoryRouter.get("/suppliers", requireRole("viewer"), async (_req, res, next) => {
  try {
    const { rows } = await pool.query(
      `SELECT id::text, name, email, phone, lead_time_days, is_active, created_at::text, updated_at::text
       FROM suppliers
       ORDER BY name ASC`
    );

    res.json(
      rows.map((row) => ({
        id: row.id,
        name: row.name,
        email: row.email ?? "",
        phone: row.phone ?? "",
        leadTimeDays: Number(row.lead_time_days ?? 0),
        isActive: Boolean(row.is_active),
        createdAt: row.created_at,
        updatedAt: row.updated_at,
      }))
    );
  } catch (err) {
    next(err);
  }
});

inventoryRouter.get("/products/:id/suppliers", requireRole("viewer"), async (req, res, next) => {
  try {
    const productId = req.params.id;
    const { rows } = await pool.query(
      `SELECT
        m.product_id::text,
        s.id::text AS supplier_id,
        s.name,
        s.email,
        s.phone,
        COALESCE(m.lead_time_days, s.lead_time_days)::int AS lead_time_days,
        m.supplier_sku,
        m.min_order_qty,
        m.preferred
       FROM product_supplier_map m
       INNER JOIN suppliers s ON s.id = m.supplier_id
       WHERE m.product_id = $1
       ORDER BY m.preferred DESC, s.name ASC`,
      [productId]
    );

    res.json(
      rows.map((row) => ({
        productId: row.product_id,
        supplierId: row.supplier_id,
        name: row.name,
        email: row.email ?? "",
        phone: row.phone ?? "",
        leadTimeDays: Number(row.lead_time_days ?? 0),
        supplierSku: row.supplier_sku ?? "",
        minOrderQty: Number(row.min_order_qty ?? 1),
        preferred: Boolean(row.preferred),
      }))
    );
  } catch (err) {
    next(err);
  }
});

const UpdateInventorySettingsSchema = z
  .object({
    reorderThreshold: z.number().int().min(0).optional(),
    supplier: z
      .object({
        name: z.string().min(1),
        email: z.string().email().optional(),
        phone: z.string().optional(),
        leadTimeDays: z.number().int().min(0).optional(),
        supplierSku: z.string().optional(),
        minOrderQty: z.number().int().positive().optional(),
        preferred: z.boolean().optional(),
      })
      .optional(),
  })
  .refine((value) => Object.keys(value).length > 0, {
    message: "No inventory settings provided",
  });

inventoryRouter.patch("/products/:id/settings", requireRole("manager"), async (req, res, next) => {
  const client = await pool.connect();
  try {
    const productId = req.params.id;
    const body = UpdateInventorySettingsSchema.parse(req.body);
    const actor = getActor(req);
    await client.query("BEGIN");

    if (typeof body.reorderThreshold === "number") {
      await client.query("UPDATE products SET reorder_threshold = $2 WHERE id = $1", [
        productId,
        body.reorderThreshold,
      ]);
    }

    let supplierResult: Record<string, unknown> | null = null;
    if (body.supplier) {
      const supplierUpsert = await client.query(
        `INSERT INTO suppliers (name, email, phone, lead_time_days)
         VALUES ($1, $2, $3, $4)
         ON CONFLICT (name)
         DO UPDATE SET
          email = COALESCE(EXCLUDED.email, suppliers.email),
          phone = COALESCE(EXCLUDED.phone, suppliers.phone),
          lead_time_days = COALESCE(EXCLUDED.lead_time_days, suppliers.lead_time_days)
         RETURNING id::text, name, email, phone, lead_time_days`,
        [
          body.supplier.name.trim(),
          body.supplier.email?.trim() || null,
          body.supplier.phone?.trim() || null,
          body.supplier.leadTimeDays ?? null,
        ]
      );

      const supplierId = supplierUpsert.rows[0].id as string;
      await client.query(
        `INSERT INTO product_supplier_map
          (product_id, supplier_id, supplier_sku, lead_time_days, min_order_qty, preferred, updated_at)
         VALUES ($1,$2,$3,$4,$5,$6, now())
         ON CONFLICT (product_id, supplier_id)
         DO UPDATE SET
          supplier_sku = COALESCE(EXCLUDED.supplier_sku, product_supplier_map.supplier_sku),
          lead_time_days = COALESCE(EXCLUDED.lead_time_days, product_supplier_map.lead_time_days),
          min_order_qty = COALESCE(EXCLUDED.min_order_qty, product_supplier_map.min_order_qty),
          preferred = COALESCE(EXCLUDED.preferred, product_supplier_map.preferred),
          updated_at = now()`,
        [
          productId,
          supplierId,
          body.supplier.supplierSku?.trim() || null,
          body.supplier.leadTimeDays ?? null,
          body.supplier.minOrderQty ?? 1,
          body.supplier.preferred ?? false,
        ]
      );

      supplierResult = {
        supplierId,
        name: supplierUpsert.rows[0].name,
      };
    }

    const updatedProduct = await client.query(
      `SELECT id::text, reorder_threshold, stock
       FROM products
       WHERE id = $1`,
      [productId]
    );
    if (updatedProduct.rowCount === 0) {
      await client.query("ROLLBACK");
      return res.status(404).json({ message: "Product not found" });
    }

    const product = updatedProduct.rows[0];
    await writeAuditLog({
      actorId: actor.id,
      actorRole: actor.role,
      action: "inventory.settings_updated",
      entityType: "product",
      entityId: product.id,
      details: {
        reorderThreshold: Number(product.reorder_threshold),
        supplier: supplierResult,
      },
    });

    await client.query("COMMIT");
    res.json({
      productId: product.id,
      reorderThreshold: Number(product.reorder_threshold),
      stock: Number(product.stock),
      supplier: supplierResult,
    });
  } catch (err) {
    await client.query("ROLLBACK");
    next(err);
  } finally {
    client.release();
  }
});

inventoryRouter.get("/movements", requireRole("viewer"), async (req, res, next) => {
  try {
    const productId = typeof req.query.productId === "string" ? req.query.productId : undefined;
    const limit = z
      .string()
      .optional()
      .transform((value) => (value ? Number(value) : 100))
      .parse(req.query.limit);
    const normalizedLimit = Number.isFinite(limit) ? Math.min(Math.max(Number(limit), 1), 300) : 100;

    const params: unknown[] = [];
    const where: string[] = [];
    if (productId) {
      params.push(productId);
      where.push(`m.product_id = $${params.length}`);
    }
    params.push(normalizedLimit);

    const whereSql = where.length > 0 ? `WHERE ${where.join(" AND ")}` : "";

    const { rows } = await pool.query(
      `SELECT m.id::text, m.product_id::text, p.name AS product_name, p.sku,
              m.movement_type, m.quantity, m.previous_stock, m.next_stock,
              m.reason, m.performed_by, m.metadata, m.created_at::text
       FROM stock_movements m
       INNER JOIN products p ON p.id = m.product_id
       ${whereSql}
       ORDER BY m.created_at DESC
       LIMIT $${params.length}`,
      params
    );

    res.json(
      rows.map((row) => ({
        id: row.id,
        productId: row.product_id,
        productName: row.product_name,
        sku: row.sku ?? "",
        movementType: row.movement_type,
        quantity: Number(row.quantity),
        previousStock: Number(row.previous_stock),
        nextStock: Number(row.next_stock),
        reason: row.reason ?? "",
        performedBy: row.performed_by ?? "",
        metadata: row.metadata ?? null,
        createdAt: row.created_at,
      }))
    );
  } catch (err) {
    next(err);
  }
});

const CreateMovementSchema = z.object({
  productId: z.string(),
  movementType: z.enum(["in", "out", "adjustment"]).default("adjustment"),
  quantity: z.number().int(),
  reason: z.string().optional(),
});

inventoryRouter.post("/movements", requireRole("manager"), async (req, res, next) => {
  const client = await pool.connect();
  try {
    const body = CreateMovementSchema.parse(req.body);
    const actor = getActor(req);

    if (body.quantity === 0) {
      return res.status(400).json({ message: "Quantity cannot be zero." });
    }

    await client.query("BEGIN");

    const productRows = await client.query(
      "SELECT id::text, name, stock, reorder_threshold FROM products WHERE id = $1 FOR UPDATE",
      [body.productId]
    );
    if (productRows.rowCount === 0) {
      await client.query("ROLLBACK");
      return res.status(404).json({ message: "Product not found" });
    }

    const product = productRows.rows[0];
    const previousStock = Number(product.stock);
    const rawQuantity = Math.abs(body.quantity);
    const signedQuantity =
      body.movementType === "in" ? rawQuantity : body.movementType === "out" ? -rawQuantity : body.quantity;
    const nextStock = Math.max(0, previousStock + signedQuantity);

    await client.query("UPDATE products SET stock = $2 WHERE id = $1", [body.productId, nextStock]);

    const movementRows = await client.query(
      `INSERT INTO stock_movements
        (product_id, movement_type, quantity, previous_stock, next_stock, reason, performed_by, metadata)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8)
       RETURNING id::text, created_at::text`,
      [
        body.productId,
        body.movementType,
        signedQuantity,
        previousStock,
        nextStock,
        body.reason?.trim() || "Manual inventory update",
        actor.id,
        JSON.stringify({ actorRole: actor.role }),
      ]
    );

    const threshold = Number(product.reorder_threshold ?? 10);
    if (nextStock <= threshold) {
      const existingAlert = await client.query(
        "SELECT id FROM inventory_alerts WHERE product_id = $1 AND resolved_at IS NULL LIMIT 1",
        [body.productId]
      );
      if (existingAlert.rowCount === 0) {
        await client.query(
          `INSERT INTO inventory_alerts (product_id, stock_level, threshold)
           VALUES ($1, $2, $3)`,
          [body.productId, nextStock, threshold]
        );
      }
    } else {
      await client.query(
        "UPDATE inventory_alerts SET resolved_at = now() WHERE product_id = $1 AND resolved_at IS NULL",
        [body.productId]
      );
    }

    await writeAuditLog({
      actorId: actor.id,
      actorRole: actor.role,
      action: "inventory.stock_moved",
      entityType: "product",
      entityId: body.productId,
      details: {
        movementType: body.movementType,
        quantity: signedQuantity,
        previousStock,
        nextStock,
        reason: body.reason ?? "",
      },
    });

    await client.query("COMMIT");

    res.status(201).json({
      id: movementRows.rows[0].id,
      productId: body.productId,
      productName: product.name,
      movementType: body.movementType,
      quantity: signedQuantity,
      previousStock,
      nextStock,
      createdAt: movementRows.rows[0].created_at,
    });
  } catch (err) {
    await client.query("ROLLBACK");
    next(err);
  } finally {
    client.release();
  }
});

