import { Router } from "express";
import { z } from "zod";
import { getActor, requireAuth } from "../auth/auth.middleware";
import { getCustomerProfile } from "../auth/auth.service";
import { config } from "../config";
import { pool } from "../db/pool";
import { hashPassword, verifyPassword } from "../lib/authCrypto";
export const accountRouter = Router();
const ProfileUpdateSchema = z
    .object({
    fullName: z.string().trim().min(1).max(120).optional(),
    phone: z.string().trim().optional(),
    address: z.string().trim().optional(),
    accountType: z.enum(["customer", "contractor", "company"]).optional(),
    companyName: z.string().trim().max(160).optional(),
    companyRole: z.string().trim().max(120).optional(),
    taxId: z.string().trim().max(80).optional(),
})
    .refine((value) => Object.keys(value).length > 0, {
    message: "No profile fields provided",
});
const PasswordChangeSchema = z.object({
    currentPassword: z.string().min(1),
    newPassword: z.string().min(8).max(128),
});
const DeleteAccountSchema = z.object({
    password: z.string().min(1),
});
const PaymentMethodSchema = z.object({
    label: z.string().trim().min(1).max(80),
    paymentType: z.enum(["card", "mpesa"]).default("card"),
    brand: z.string().trim().min(1).max(40).optional(),
    last4: z
        .string()
        .trim()
        .regex(/^\d{4}$/)
        .optional(),
    expMonth: z.number().int().min(1).max(12).optional(),
    expYear: z.number().int().min(2020).max(2100).optional(),
    provider: z.string().trim().min(1).max(80).optional(),
    providerToken: z.string().trim().min(1).max(200).optional(),
    isDefault: z.boolean().optional(),
});
const PaymentMethodPatchSchema = z
    .object({
    label: z.string().trim().min(1).max(80).optional(),
    paymentType: z.enum(["card", "mpesa"]).optional(),
    brand: z.string().trim().min(1).max(40).optional(),
    last4: z
        .string()
        .trim()
        .regex(/^\d{4}$/)
        .optional(),
    expMonth: z.number().int().min(1).max(12).optional(),
    expYear: z.number().int().min(2020).max(2100).optional(),
    provider: z.string().trim().min(1).max(80).optional(),
    providerToken: z.string().trim().min(1).max(200).optional(),
    isDefault: z.boolean().optional(),
})
    .refine((value) => Object.keys(value).length > 0, {
    message: "No payment fields provided",
});
const WishlistItemSchema = z.object({
    productId: z.string().uuid(),
});
function normalizeOptionalString(value) {
    if (typeof value !== "string")
        return null;
    const trimmed = value.trim();
    return trimmed.length > 0 ? trimmed : null;
}
accountRouter.get("/profile", requireAuth({ domain: "customer" }), async (req, res, next) => {
    try {
        const actor = getActor(req);
        const user = await getCustomerProfile(actor.id);
        if (!user)
            return res.status(404).json({ message: "User not found" });
        return res.json({ user });
    }
    catch (err) {
        return next(err);
    }
});
accountRouter.patch("/profile", requireAuth({ domain: "customer" }), async (req, res, next) => {
    try {
        const actor = getActor(req);
        const body = ProfileUpdateSchema.parse(req.body ?? {});
        const { rows } = await pool.query("SELECT full_name FROM users WHERE id = $1", [actor.id]);
        if (rows.length === 0)
            return res.status(404).json({ message: "User not found" });
        const updatedFullName = body.fullName ?? rows[0].full_name;
        if (body.fullName) {
            await pool.query("UPDATE users SET full_name = $1, updated_at = now() WHERE id = $2", [
                updatedFullName,
                actor.id,
            ]);
        }
        await pool.query(`INSERT INTO user_profiles (user_id, name, phone, address, account_type, company_name, company_role, tax_id)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
       ON CONFLICT (user_id)
       DO UPDATE SET
         name = EXCLUDED.name,
         phone = COALESCE(EXCLUDED.phone, user_profiles.phone),
         address = COALESCE(EXCLUDED.address, user_profiles.address),
         account_type = COALESCE(EXCLUDED.account_type, user_profiles.account_type),
         company_name = COALESCE(EXCLUDED.company_name, user_profiles.company_name),
         company_role = COALESCE(EXCLUDED.company_role, user_profiles.company_role),
         tax_id = COALESCE(EXCLUDED.tax_id, user_profiles.tax_id),
         updated_at = now()`, [
            actor.id,
            updatedFullName,
            normalizeOptionalString(body.phone),
            normalizeOptionalString(body.address),
            body.accountType ?? null,
            normalizeOptionalString(body.companyName),
            normalizeOptionalString(body.companyRole),
            normalizeOptionalString(body.taxId),
        ]);
        const user = await getCustomerProfile(actor.id);
        if (!user)
            return res.status(404).json({ message: "User not found" });
        return res.json({ user });
    }
    catch (err) {
        return next(err);
    }
});
accountRouter.get("/wishlist", requireAuth({ domain: "customer" }), async (req, res, next) => {
    try {
        const actor = getActor(req);
        const { rows } = await pool.query(`SELECT
        p.id::text,
        p.name,
        COALESCE(p.sku, '') AS sku,
        COALESCE(p.category, '') AS category,
        p.price_cents,
        p.currency,
        p.stock,
        COALESCE(p.image_url, '') AS image_url,
        p.created_at::text
      FROM user_wishlist uw
      INNER JOIN products p ON p.id = uw.product_id
      WHERE uw.user_id = $1
      ORDER BY uw.created_at DESC`, [actor.id]);
        return res.json({
            items: rows.map((row) => ({
                productId: row.id,
                name: row.name,
                sku: row.sku,
                category: row.category,
                priceCents: Number(row.price_cents),
                currency: row.currency,
                stock: Number(row.stock),
                imageUrl: row.image_url,
                createdAt: row.created_at,
            })),
        });
    }
    catch (err) {
        return next(err);
    }
});
accountRouter.post("/wishlist", requireAuth({ domain: "customer" }), async (req, res, next) => {
    try {
        const actor = getActor(req);
        const body = WishlistItemSchema.parse(req.body ?? {});
        const exists = await pool.query("SELECT 1 FROM products WHERE id = $1", [body.productId]);
        if (exists.rowCount === 0)
            return res.status(404).json({ message: "Product not found" });
        await pool.query(`INSERT INTO user_wishlist (user_id, product_id)
       VALUES ($1, $2)
       ON CONFLICT (user_id, product_id) DO NOTHING`, [actor.id, body.productId]);
        return res.status(201).json({ ok: true });
    }
    catch (err) {
        return next(err);
    }
});
accountRouter.delete("/wishlist/:productId", requireAuth({ domain: "customer" }), async (req, res, next) => {
    try {
        const actor = getActor(req);
        const productId = req.params.productId;
        await pool.query("DELETE FROM user_wishlist WHERE user_id = $1 AND product_id = $2", [actor.id, productId]);
        return res.status(204).send();
    }
    catch (err) {
        return next(err);
    }
});
accountRouter.get("/orders", requireAuth({ domain: "customer" }), async (req, res, next) => {
    try {
        const actor = getActor(req);
        const userRows = await pool.query("SELECT email FROM users WHERE id = $1", [actor.id]);
        if (userRows.rowCount === 0)
            return res.status(404).json({ message: "User not found" });
        const email = userRows.rows[0].email;
        const orderRows = await pool.query(`SELECT
        o.id::text,
        o.status,
        o.payment_status,
        o.payment_method,
        o.currency,
        o.total_cents,
        o.shipping_method,
        o.created_at::text,
        COALESCE(SUM(oi.quantity), 0) AS item_count
      FROM orders o
      LEFT JOIN order_items oi ON oi.order_id = o.id
      WHERE o.customer_email = $1
      GROUP BY o.id
      ORDER BY o.created_at DESC`, [email]);
        const items = orderRows.rows.map((row) => ({
            id: row.id,
            status: row.status,
            paymentStatus: row.payment_status ?? "pending",
            paymentMethod: row.payment_method ?? "",
            currency: row.currency,
            totalCents: Number(row.total_cents),
            shippingMethod: row.shipping_method ?? "",
            itemCount: Number(row.item_count ?? 0),
            createdAt: row.created_at,
        }));
        return res.json({ items });
    }
    catch (err) {
        return next(err);
    }
});
accountRouter.get("/payment-methods", requireAuth({ domain: "customer" }), async (req, res, next) => {
    try {
        const actor = getActor(req);
        const { rows } = await pool.query(`SELECT
        id::text,
        label,
        payment_type,
        brand,
        last4,
        exp_month,
        exp_year,
        provider,
        is_default,
        created_at::text,
        updated_at::text
      FROM payment_methods
      WHERE user_id = $1
      ORDER BY is_default DESC, created_at DESC`, [actor.id]);
        const methods = rows.map((row) => ({
            id: row.id,
            label: row.label,
            paymentType: row.payment_type,
            brand: row.brand ?? "",
            last4: row.last4 ?? "",
            expMonth: row.exp_month ?? null,
            expYear: row.exp_year ?? null,
            provider: row.provider ?? "",
            isDefault: Boolean(row.is_default),
            createdAt: row.created_at,
            updatedAt: row.updated_at,
        }));
        return res.json({ methods });
    }
    catch (err) {
        return next(err);
    }
});
accountRouter.post("/payment-methods", requireAuth({ domain: "customer" }), async (req, res, next) => {
    const client = await pool.connect();
    try {
        const actor = getActor(req);
        const body = PaymentMethodSchema.parse(req.body ?? {});
        const shouldSetDefault = Boolean(body.isDefault);
        await client.query("BEGIN");
        if (shouldSetDefault) {
            await client.query("UPDATE payment_methods SET is_default = false WHERE user_id = $1", [actor.id]);
        }
        const { rows } = await client.query(`INSERT INTO payment_methods (
        user_id, label, payment_type, brand, last4, exp_month, exp_year, provider, provider_token, is_default
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
      RETURNING
        id::text,
        label,
        payment_type,
        brand,
        last4,
        exp_month,
        exp_year,
        provider,
        is_default,
        created_at::text,
        updated_at::text`, [
            actor.id,
            body.label,
            body.paymentType,
            normalizeOptionalString(body.brand),
            normalizeOptionalString(body.last4),
            body.expMonth ?? null,
            body.expYear ?? null,
            normalizeOptionalString(body.provider),
            normalizeOptionalString(body.providerToken),
            shouldSetDefault,
        ]);
        await client.query("COMMIT");
        const method = rows[0]
            ? {
                id: rows[0].id,
                label: rows[0].label,
                paymentType: rows[0].payment_type,
                brand: rows[0].brand ?? "",
                last4: rows[0].last4 ?? "",
                expMonth: rows[0].exp_month ?? null,
                expYear: rows[0].exp_year ?? null,
                provider: rows[0].provider ?? "",
                isDefault: Boolean(rows[0].is_default),
                createdAt: rows[0].created_at,
                updatedAt: rows[0].updated_at,
            }
            : null;
        if (!method)
            return res.status(500).json({ message: "Failed to create payment method" });
        return res.status(201).json({ method });
    }
    catch (err) {
        await client.query("ROLLBACK");
        return next(err);
    }
    finally {
        client.release();
    }
});
accountRouter.patch("/payment-methods/:id", requireAuth({ domain: "customer" }), async (req, res, next) => {
    const client = await pool.connect();
    try {
        const actor = getActor(req);
        const body = PaymentMethodPatchSchema.parse(req.body ?? {});
        const id = req.params.id;
        await client.query("BEGIN");
        if (body.isDefault) {
            await client.query("UPDATE payment_methods SET is_default = false WHERE user_id = $1", [actor.id]);
        }
        const { rows } = await client.query(`UPDATE payment_methods
       SET
         label = COALESCE($3, label),
         payment_type = COALESCE($4, payment_type),
         brand = COALESCE($5, brand),
         last4 = COALESCE($6, last4),
         exp_month = COALESCE($7, exp_month),
         exp_year = COALESCE($8, exp_year),
         provider = COALESCE($9, provider),
         provider_token = COALESCE($10, provider_token),
         is_default = COALESCE($11, is_default),
         updated_at = now()
       WHERE id = $1 AND user_id = $2
       RETURNING
        id::text,
        label,
        payment_type,
        brand,
        last4,
        exp_month,
        exp_year,
        provider,
        is_default,
        created_at::text,
        updated_at::text`, [
            id,
            actor.id,
            body.label ?? null,
            body.paymentType ?? null,
            normalizeOptionalString(body.brand ?? undefined),
            normalizeOptionalString(body.last4 ?? undefined),
            body.expMonth ?? null,
            body.expYear ?? null,
            normalizeOptionalString(body.provider ?? undefined),
            normalizeOptionalString(body.providerToken ?? undefined),
            typeof body.isDefault === "boolean" ? body.isDefault : null,
        ]);
        await client.query("COMMIT");
        if (rows.length === 0)
            return res.status(404).json({ message: "Payment method not found" });
        const method = {
            id: rows[0].id,
            label: rows[0].label,
            paymentType: rows[0].payment_type,
            brand: rows[0].brand ?? "",
            last4: rows[0].last4 ?? "",
            expMonth: rows[0].exp_month ?? null,
            expYear: rows[0].exp_year ?? null,
            provider: rows[0].provider ?? "",
            isDefault: Boolean(rows[0].is_default),
            createdAt: rows[0].created_at,
            updatedAt: rows[0].updated_at,
        };
        return res.json({ method });
    }
    catch (err) {
        await client.query("ROLLBACK");
        return next(err);
    }
    finally {
        client.release();
    }
});
accountRouter.delete("/payment-methods/:id", requireAuth({ domain: "customer" }), async (req, res, next) => {
    try {
        const actor = getActor(req);
        const id = req.params.id;
        const { rowCount } = await pool.query("DELETE FROM payment_methods WHERE id = $1 AND user_id = $2", [
            id,
            actor.id,
        ]);
        if (!rowCount)
            return res.status(404).json({ message: "Payment method not found" });
        return res.status(204).send();
    }
    catch (err) {
        return next(err);
    }
});
accountRouter.patch("/password", requireAuth({ domain: "customer" }), async (req, res, next) => {
    try {
        const actor = getActor(req);
        const body = PasswordChangeSchema.parse(req.body ?? {});
        const { rows } = await pool.query("SELECT password_hash FROM users WHERE id = $1", [
            actor.id,
        ]);
        if (rows.length === 0)
            return res.status(404).json({ message: "User not found" });
        const currentHash = rows[0].password_hash;
        const ok = await verifyPassword(body.currentPassword, currentHash);
        if (!ok)
            return res.status(401).json({ message: "Current password is incorrect" });
        const nextHash = await hashPassword(body.newPassword, config.passwordHashRounds);
        await pool.query("UPDATE users SET password_hash = $1, updated_at = now() WHERE id = $2", [nextHash, actor.id]);
        return res.status(204).send();
    }
    catch (err) {
        return next(err);
    }
});
accountRouter.delete("/", requireAuth({ domain: "customer" }), async (req, res, next) => {
    try {
        const actor = getActor(req);
        const body = DeleteAccountSchema.parse(req.body ?? {});
        const { rows } = await pool.query("SELECT password_hash FROM users WHERE id = $1", [
            actor.id,
        ]);
        if (rows.length === 0)
            return res.status(404).json({ message: "User not found" });
        const ok = await verifyPassword(body.password, rows[0].password_hash);
        if (!ok)
            return res.status(401).json({ message: "Password is incorrect" });
        await pool.query("DELETE FROM users WHERE id = $1", [actor.id]);
        return res.status(204).send();
    }
    catch (err) {
        return next(err);
    }
});
