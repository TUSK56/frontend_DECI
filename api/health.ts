import type { VercelRequest, VercelResponse } from "@vercel/node";

/**
 * Smoke test: proves serverless API is deployed.
 * GET /api/health
 */
export default function handler(_req: VercelRequest, res: VercelResponse) {
  res.status(200).json({
    ok: true,
    service: "deci-vercel-api",
    time: new Date().toISOString(),
  });
}
