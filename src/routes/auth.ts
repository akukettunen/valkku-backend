import { Router, Request, Response } from "express";
import { requireAuth } from "@/middleware/auth";

const router: Router = Router();
const DOMAIN = process.env['AUTH0_DOMAIN']!; // e.g. "valkku.eu.auth0.com"
const APP_BASE = process.env['APP_BASE_URL'] || "http://localhost:3000";

// --- cache Management token ---
let mgmtCache: { token: string; exp: number } | null = null;
async function getMgmtToken(): Promise<string> {
  const now = Math.floor(Date.now() / 1000);
  if (mgmtCache && now < mgmtCache.exp - 60) return mgmtCache.token;

  const resp = await fetch(`https://${DOMAIN}/oauth/token`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({
      grant_type: "client_credentials",
      client_id: process.env['AUTH0_M2M_CLIENT_ID'],
      client_secret: process.env['AUTH0_M2M_CLIENT_SECRET'],
      audience: process.env['AUTH0_AUDIENCE'],
    }),
  });
  if (!resp.ok) throw new Error(`Mgmt token error ${resp.status}: ${await resp.text()}`);
  const { access_token, expires_in } = await resp.json() as { access_token: string; expires_in: number };
  mgmtCache = { token: access_token, exp: now + expires_in };
  return access_token;
}

// Optional: allow only DB users (quick check)
function assertDbUser(userId: string) {
  if (!userId.startsWith("auth0|")) {
    const err: any = new Error("Password changes not allowed for this provider");
    err.status = 403;
    throw err;
  }
}

// POST /auth/password/change-ticket
router.post("/password/change-ticket", requireAuth, async (req: Request, res: Response) => {
  try {
    // express-oauth2-jwt-bearer puts claims on req.auth (payload.sub)
    const userId = (req as any).auth?.payload?.sub as string | undefined;
    if (!userId) return res.status(401).json({ success: false, message: "Missing user identity" });

    // Optional: block social/enterprise users
    assertDbUser(userId);

    const mgmtToken = await getMgmtToken();

    const resp = await fetch(`https://${DOMAIN}/api/v2/tickets/password-change`, {
      method: "POST",
      headers: { "content-type": "application/json", authorization: `Bearer ${mgmtToken}` },
      body: JSON.stringify({
        user_id: userId,
        // result_url: `${APP_BASE}/settings?pwd=done`,
        ttl_sec: 600,
        client_id: process.env['AUTH0_SPA_CLIENT_ID']
      }),
    });

    if (!resp.ok) {
      const txt = await resp.text().catch(() => "");
      return res.status(502).json({ success: false, message: "Failed to create password-change ticket" });
    }

    const { ticket } = await resp.json() as { ticket: string };
    return res.status(200).json({ success: true, data: { url: ticket } });
  } catch (e: any) {
    const status = e?.status ?? 500;
    return res.status(status).json({
      success: false,
      message: status === 403
        ? "Password changes are not available for this login provider"
        : "Internal server error during password change ticket creation",
    });
  }
});

export default router;