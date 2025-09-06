import { Router, Request, Response } from "express";
import { requireAuth } from "@/middleware/auth";
import { getMgmtToken } from "@/utils/authHelper";

const router: Router = Router();
const DOMAIN = process.env['AUTH0_DOMAIN']!;

router.post("/password/change-ticket", requireAuth, async (req: Request, res: Response) => {
  try {
    const userId = (req as any).auth?.payload?.sub as string | undefined;
    if (!userId) return res.status(401).json({ success: false, message: "Missing user identity" });

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