import dotenv from 'dotenv';
import argon2 from "argon2"
dotenv.config({ quiet: true });
import { TokenUser } from '@/types/user';
import { ROLES } from '@/types/team';

// Create hash
export async function hashPassword(plain: string) {
  return argon2.hash(plain, {
    type: argon2.argon2id,     // Argon2id = resist GPU + side-channels
    memoryCost: 1 << 16,       // 64 MiB
    timeCost: 3,               // iterations
    parallelism: 1,            // threads
    hashLength: 32,            // bytes
    // salt: optional; library generates a cryptographically secure random salt
  })
}

// Verify
export async function verifyPassword(hash: string, plain: string) {
  return argon2.verify(hash, plain)  // constant-time compare
}


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

export function hasRoleInTeam(user: TokenUser, teamId: string, rolesArray: ROLES[]) {
  const userTeam = user.teams.find(team => team.teamId === teamId);

  if(!userTeam) return false;

  return userTeam.roles.some(role => rolesArray.includes(role.role));
}
