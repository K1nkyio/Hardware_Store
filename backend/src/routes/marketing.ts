import { Router } from "express";
import { z } from "zod";
import { pool } from "../db/pool";

export const marketingRouter = Router();

const AbandonedCartSchema = z.object({
  customerEmail: z.string().email(),
  currency: z.string(),
  subtotalCents: z.number().int().nonnegative(),
  cartItems: z.array(
    z.object({
      productId: z.string(),
      name: z.string(),
      quantity: z.number().int().positive(),
    })
  ),
});

marketingRouter.post("/abandoned-cart", async (req, res, next) => {
  try {
    const body = AbandonedCartSchema.parse(req.body);
    await pool.query(
      `INSERT INTO abandoned_carts (customer_email, currency, subtotal_cents, cart_items, last_seen)
       VALUES ($1,$2,$3,$4, now())
       ON CONFLICT (customer_email)
       DO UPDATE SET
         currency = EXCLUDED.currency,
         subtotal_cents = EXCLUDED.subtotal_cents,
         cart_items = EXCLUDED.cart_items,
         last_seen = now(),
         status = 'open'`,
      [body.customerEmail, body.currency, body.subtotalCents, JSON.stringify(body.cartItems)]
    );
    res.status(204).send();
  } catch (err) {
    next(err);
  }
});
