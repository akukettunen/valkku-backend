import dotenv from 'dotenv';
dotenv.config();

let mgmtCache: { token: string; exp: number } | null = null;
export async function getMgmtToken(): Promise<string> {
  const now = Math.floor(Date.now() / 1000);
  if (mgmtCache && now < mgmtCache.exp - 60) return mgmtCache.token;

  const DOMAIN = process.env['AUTH0_DOMAIN']!;

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