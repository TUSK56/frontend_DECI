import type { VercelRequest, VercelResponse } from "@vercel/node";
import sql from "mssql";

/**
 * Optional: verifies SQL Server is reachable from Vercel (same connection string as .NET DefaultConnection).
 * Set env SQLSERVER_CONNECTION_STRING in Vercel project settings.
 * GET /api/db-ping
 */
export default async function handler(_req: VercelRequest, res: VercelResponse) {
  const conn = process.env.SQLSERVER_CONNECTION_STRING;
  if (!conn) {
    res.status(503).json({ ok: false, error: "SQLSERVER_CONNECTION_STRING is not set" });
    return;
  }

  let pool: sql.ConnectionPool | undefined;
  try {
    pool = await sql.connect(conn);
    await pool.request().query("SELECT 1 AS n");
    res.status(200).json({ ok: true, db: "reachable" });
  } catch {
    res.status(500).json({ ok: false, error: "Database connection failed (check string, firewall, IP allowlist)" });
  } finally {
    if (pool) await pool.close().catch(() => undefined);
  }
}
