import { pool } from "../db/pool";
export async function writeAuditLog(payload) {
    await pool.query(`INSERT INTO audit_logs (actor_id, actor_role, action, entity_type, entity_id, details)
     VALUES ($1,$2,$3,$4,$5,$6)`, [
        payload.actorId ?? null,
        payload.actorRole ?? null,
        payload.action,
        payload.entityType,
        payload.entityId ?? null,
        payload.details ?? null,
    ]);
    const adminRoles = new Set(["viewer", "manager", "super_admin"]);
    if (payload.actorId && payload.actorRole && adminRoles.has(payload.actorRole)) {
        await pool.query(`INSERT INTO admin_audit_logs (admin_id, action, target_type, target_id, metadata)
       VALUES ($1, $2, $3, $4, $5)`, [
            payload.actorId,
            payload.action,
            payload.entityType,
            payload.entityId ?? null,
            payload.details ?? null,
        ]);
    }
}
export async function writeErrorLog(payload) {
    await pool.query(`INSERT INTO error_logs (request_id, method, path, status_code, message, stack, metadata)
     VALUES ($1,$2,$3,$4,$5,$6,$7)`, [
        payload.requestId ?? null,
        payload.method ?? null,
        payload.path ?? null,
        payload.statusCode ?? null,
        payload.message,
        payload.stack ?? null,
        payload.metadata ?? null,
    ]);
}
