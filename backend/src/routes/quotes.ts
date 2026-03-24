import { Router } from "express";
import { z } from "zod";
import { getActor, requireAuth } from "../auth/auth.middleware";
import { pool } from "../db/pool";

export const quotesRouter = Router();

const QuoteRequestSchema = z.object({
  productId: z.string().uuid().optional(),
  branchId: z.string().uuid().optional(),
  customerName: z.string().trim().min(1).max(160),
  customerEmail: z.string().email(),
  customerPhone: z.string().trim().max(60).optional(),
  companyName: z.string().trim().max(160).optional(),
  accountType: z.enum(["customer", "contractor", "company"]).default("customer"),
  quantity: z.number().int().positive().max(10000).default(1),
  notes: z.string().trim().max(2000).optional(),
});

quotesRouter.post("/", async (req, res, next) => {
  try {
    const body = QuoteRequestSchema.parse(req.body ?? {});
    const { rows } = await pool.query(
      `INSERT INTO quote_requests (
        product_id, branch_id, customer_name, customer_email, customer_phone, company_name, account_type, quantity, notes
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
      RETURNING
        id::text,
        product_id::text,
        branch_id::text,
        customer_name,
        customer_email,
        customer_phone,
        company_name,
        account_type,
        quantity,
        notes,
        status,
        created_at::text`,
      [
        body.productId ?? null,
        body.branchId ?? null,
        body.customerName,
        body.customerEmail,
        body.customerPhone?.trim() || null,
        body.companyName?.trim() || null,
        body.accountType,
        body.quantity,
        body.notes?.trim() || null,
      ]
    );

    res.status(201).json({
      quote: {
        id: rows[0].id,
        productId: rows[0].product_id ?? "",
        branchId: rows[0].branch_id ?? "",
        customerName: rows[0].customer_name,
        customerEmail: rows[0].customer_email,
        customerPhone: rows[0].customer_phone ?? "",
        companyName: rows[0].company_name ?? "",
        accountType: rows[0].account_type,
        quantity: Number(rows[0].quantity),
        notes: rows[0].notes ?? "",
        status: rows[0].status,
        createdAt: rows[0].created_at,
      },
    });
  } catch (err) {
    next(err);
  }
});

quotesRouter.get("/mine", requireAuth({ domain: "customer" }), async (req, res, next) => {
  try {
    const actor = getActor(req);
    const emailRows = await pool.query<{ email: string }>("SELECT email FROM users WHERE id = $1", [actor.id]);
    if (emailRows.rowCount === 0) return res.status(404).json({ message: "User not found" });

    const { rows } = await pool.query(
      `SELECT
        qr.id::text,
        qr.product_id::text,
        qr.branch_id::text,
        qr.customer_name,
        qr.customer_email,
        qr.customer_phone,
        qr.company_name,
        qr.account_type,
        qr.quantity,
        qr.notes,
        qr.status,
        qr.created_at::text,
        COALESCE(p.name, '') AS product_name
      FROM quote_requests qr
      LEFT JOIN products p ON p.id = qr.product_id
      WHERE lower(qr.customer_email) = lower($1)
      ORDER BY qr.created_at DESC`,
      [emailRows.rows[0].email]
    );

    res.json({
      items: rows.map((row) => ({
        id: row.id,
        productId: row.product_id ?? "",
        branchId: row.branch_id ?? "",
        productName: row.product_name ?? "",
        customerName: row.customer_name,
        customerEmail: row.customer_email,
        customerPhone: row.customer_phone ?? "",
        companyName: row.company_name ?? "",
        accountType: row.account_type,
        quantity: Number(row.quantity),
        notes: row.notes ?? "",
        status: row.status,
        createdAt: row.created_at,
      })),
    });
  } catch (err) {
    next(err);
  }
});
