import { Router } from "express";
import { z } from "zod";
import { pool } from "../db/pool";
import { getActor, requireRole } from "../middleware/auth";
import { writeAuditLog } from "../lib/audit";
export const customerCareRouter = Router();
const InquiryStatusSchema = z.enum(["pending", "in_review", "resolved", "spam"]);
const CreateInquirySchema = z.object({
    firstName: z.string().trim().min(1).max(120),
    lastName: z.string().trim().min(1).max(120),
    email: z.string().trim().email().max(255),
    orderNumber: z.string().trim().max(120).optional(),
    message: z.string().trim().min(10).max(4000),
});
const ListInquiriesQuerySchema = z.object({
    q: z.string().trim().optional(),
    status: InquiryStatusSchema.optional(),
    limit: z
        .string()
        .optional()
        .transform((value) => (value ? Number(value) : 100)),
});
const UpdateInquirySchema = z.object({
    status: InquiryStatusSchema,
    moderationNote: z.string().trim().max(1000).optional(),
});
customerCareRouter.post("/inquiries", async (req, res, next) => {
    try {
        const body = CreateInquirySchema.parse(req.body);
        const { rows } = await pool.query(`INSERT INTO customer_inquiries (first_name, last_name, email, order_number, message)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING id::text, first_name, last_name, email, order_number, message, status,
                 moderation_note, moderated_by::text, moderated_at::text, created_at::text, updated_at::text`, [body.firstName, body.lastName, body.email, body.orderNumber ?? null, body.message]);
        const row = rows[0];
        res.status(201).json({
            id: row.id,
            firstName: row.first_name,
            lastName: row.last_name,
            email: row.email,
            orderNumber: row.order_number ?? "",
            message: row.message,
            status: row.status,
            moderationNote: row.moderation_note ?? "",
            moderatedBy: row.moderated_by ?? "",
            moderatedAt: row.moderated_at ?? "",
            createdAt: row.created_at,
            updatedAt: row.updated_at,
        });
    }
    catch (err) {
        next(err);
    }
});
customerCareRouter.get("/inquiries", requireRole("viewer"), async (req, res, next) => {
    try {
        const parsedQuery = ListInquiriesQuerySchema.parse(req.query);
        const q = parsedQuery.q?.trim() ?? "";
        const limit = Number.isFinite(parsedQuery.limit)
            ? Math.min(Math.max(Number(parsedQuery.limit), 1), 300)
            : 100;
        const params = [];
        const whereParts = [];
        if (parsedQuery.status) {
            params.push(parsedQuery.status);
            whereParts.push(`ci.status = $${params.length}`);
        }
        if (q) {
            params.push(`%${q}%`);
            const idx = params.length;
            whereParts.push(`(ci.first_name ILIKE $${idx} OR ci.last_name ILIKE $${idx} OR ci.email ILIKE $${idx} OR ci.order_number ILIKE $${idx} OR ci.message ILIKE $${idx})`);
        }
        params.push(limit);
        const whereSql = whereParts.length > 0 ? `WHERE ${whereParts.join(" AND ")}` : "";
        const { rows } = await pool.query(`SELECT ci.id::text, ci.first_name, ci.last_name, ci.email, ci.order_number, ci.message, ci.status,
              ci.moderation_note, ci.moderated_by::text, ci.moderated_at::text, ci.created_at::text, ci.updated_at::text,
              COALESCE(a.full_name, a.email) AS moderated_by_name
       FROM customer_inquiries ci
       LEFT JOIN admins a ON a.id = ci.moderated_by
       ${whereSql}
       ORDER BY ci.created_at DESC
       LIMIT $${params.length}`, params);
        res.json(rows.map((row) => ({
            id: row.id,
            firstName: row.first_name,
            lastName: row.last_name,
            email: row.email,
            orderNumber: row.order_number ?? "",
            message: row.message,
            status: row.status,
            moderationNote: row.moderation_note ?? "",
            moderatedBy: row.moderated_by ?? "",
            moderatedByName: row.moderated_by_name ?? "",
            moderatedAt: row.moderated_at ?? "",
            createdAt: row.created_at,
            updatedAt: row.updated_at,
        })));
    }
    catch (err) {
        next(err);
    }
});
customerCareRouter.patch("/inquiries/:id", requireRole("manager"), async (req, res, next) => {
    try {
        const actor = getActor(req);
        const inquiryId = req.params.id;
        const body = UpdateInquirySchema.parse(req.body);
        const { rows } = await pool.query(`UPDATE customer_inquiries
       SET
        status = $2,
        moderation_note = $3,
        moderated_by = $4::uuid,
        moderated_at = now()
       WHERE id = $1::uuid
       RETURNING id::text, first_name, last_name, email, order_number, message, status,
                 moderation_note, moderated_by::text, moderated_at::text, created_at::text, updated_at::text`, [inquiryId, body.status, body.moderationNote ?? null, actor.id]);
        if (rows.length === 0) {
            return res.status(404).json({ message: "Customer inquiry not found" });
        }
        await writeAuditLog({
            actorId: actor.id,
            actorRole: actor.role,
            action: "customer_inquiry.moderated",
            entityType: "customer_inquiry",
            entityId: inquiryId,
            details: {
                status: body.status,
                moderationNote: body.moderationNote ?? "",
            },
        });
        const row = rows[0];
        res.json({
            id: row.id,
            firstName: row.first_name,
            lastName: row.last_name,
            email: row.email,
            orderNumber: row.order_number ?? "",
            message: row.message,
            status: row.status,
            moderationNote: row.moderation_note ?? "",
            moderatedBy: row.moderated_by ?? "",
            moderatedAt: row.moderated_at ?? "",
            createdAt: row.created_at,
            updatedAt: row.updated_at,
        });
    }
    catch (err) {
        next(err);
    }
});
