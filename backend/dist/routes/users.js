import { Router } from "express";
import { requireRole } from "../auth/auth.middleware";
import { pool } from "../db/pool";
export const usersRouter = Router();
// Get all users (customers and admins) - super_admin only
usersRouter.get("/all", requireRole("super_admin"), async (req, res, next) => {
    try {
        const { rows } = await pool.query(`
      SELECT 
        'customer' as user_type,
        id,
        email,
        username,
        full_name,
        role,
        is_active,
        email_verified,
        status,
        created_at,
        last_login_at
      FROM users 

      UNION ALL

      SELECT 
        'admin' as user_type,
        id,
        email,
        username,
        full_name,
        role,
        is_active as is_active,
        null as email_verified,
        status,
        created_at,
        last_login_at
      FROM admins 

      ORDER BY created_at DESC
    `);
        res.json({
            users: rows,
            total: rows.length
        });
    }
    catch (err) {
        next(err);
    }
});
// Get customers only - manager and above
usersRouter.get("/customers", requireRole("manager"), async (req, res, next) => {
    try {
        const limit = parseInt(req.query.limit) || 50;
        const offset = parseInt(req.query.offset) || 0;
        const { rows } = await pool.query(`
      SELECT 
        id,
        email,
        username,
        full_name,
        role,
        is_active,
        email_verified,
        status,
        created_at,
        last_login_at
      FROM users 
      ORDER BY created_at DESC
      LIMIT $1 OFFSET $2
    `, [limit, offset]);
        const countResult = await pool.query("SELECT COUNT(*) FROM users");
        const total = parseInt(countResult.rows[0].count);
        res.json({
            customers: rows,
            pagination: {
                limit,
                offset,
                total,
                hasMore: offset + limit < total
            }
        });
    }
    catch (err) {
        next(err);
    }
});
// Get admins only - super_admin only
usersRouter.get("/admins", requireRole("super_admin"), async (req, res, next) => {
    try {
        const { rows } = await pool.query(`
      SELECT 
        id,
        email,
        username,
        full_name,
        role,
        status,
        created_at,
        last_login_at
      FROM admins 
      ORDER BY created_at DESC
    `);
        res.json({
            admins: rows,
            total: rows.length
        });
    }
    catch (err) {
        next(err);
    }
});
