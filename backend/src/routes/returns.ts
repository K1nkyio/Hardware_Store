import { Router } from "express";
import { z } from "zod";
import { pool } from "../db/pool";

export const returnsRouter = Router();

const ReturnRequestSchema = z.object({
  orderId: z.string(),
  customerEmail: z.string().email(),
  reason: z.string().min(5),
  items: z.array(
    z.object({
      productId: z.string(),
      quantity: z.number().int().positive(),
    })
  ),
});

returnsRouter.post("/request", async (req, res, next) => {
  try {
    const body = ReturnRequestSchema.parse(req.body);
    const orderRows = await pool.query(
      "SELECT id, customer_email FROM orders WHERE id = $1",
      [body.orderId]
    );

    if (orderRows.rowCount === 0) {
      return res.status(404).json({ message: "Order not found" });
    }

    const order = orderRows.rows[0];
    if (order.customer_email !== body.customerEmail) {
      return res.status(403).json({ message: "Email does not match order" });
    }

    const rmaNumber = `RMA-${new Date().toISOString().slice(0, 10).replace(/-/g, "")}-${Math.floor(
      1000 + Math.random() * 9000
    )}`;

    const { rows } = await pool.query(
      `INSERT INTO return_requests (rma_number, order_id, customer_email, reason, items)
       VALUES ($1,$2,$3,$4,$5)
       RETURNING id, rma_number, status, created_at::text`,
      [rmaNumber, body.orderId, body.customerEmail, body.reason, JSON.stringify(body.items)]
    );

    res.status(201).json({
      id: rows[0].id,
      rmaNumber: rows[0].rma_number,
      status: rows[0].status,
      createdAt: rows[0].created_at,
    });
  } catch (err) {
    next(err);
  }
});

returnsRouter.get("/:rmaNumber", async (req, res, next) => {
  try {
    const rmaNumber = req.params.rmaNumber;
    const { rows } = await pool.query(
      `SELECT rma_number, status, created_at::text, updated_at::text
       FROM return_requests
       WHERE rma_number = $1`,
      [rmaNumber]
    );

    if (rows.length === 0) return res.status(404).json({ message: "Not found" });
    res.json({
      rmaNumber: rows[0].rma_number,
      status: rows[0].status,
      createdAt: rows[0].created_at,
      updatedAt: rows[0].updated_at,
    });
  } catch (err) {
    next(err);
  }
});
