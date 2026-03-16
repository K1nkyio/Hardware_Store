import pg from "pg";
import { config } from "../config";
function resolveConnectionConfig(connectionString) {
    const url = new URL(connectionString);
    const fallbackPassword = String(process.env.DB_PASSWORD ?? process.env.PGPASSWORD ?? "postgres");
    const password = url.password ? decodeURIComponent(url.password) : fallbackPassword;
    return {
        host: url.hostname,
        port: url.port ? Number(url.port) : 5432,
        database: url.pathname.replace(/^\//, ""),
        user: decodeURIComponent(url.username || "postgres"),
        password,
    };
}
export const pool = new pg.Pool(resolveConnectionConfig(config.databaseUrl));
