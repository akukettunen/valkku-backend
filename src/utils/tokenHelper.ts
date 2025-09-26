// auth/tokens.ts
import { JWTPayload, SignJWT, jwtVerify } from "jose"
import crypto from "crypto"
import { PublicUser, TokenUser } from "@/types/user"
import { MinimalTeamUser } from "@/types/user"

// --- config ---
const ISS = process.env["JWT_ISSUER"]!
const AUD = process.env["JWT_AUDIENCE"]!
const ACCESS_TTL_SEC = 15 * 60 // 15 min

const REFRESH_TTL_SEC = parseInt(process.env["REFRESH_TOKEN_VALID_DAYS"] ?? '90') * 24 * 60 * 60 // 90 days

// HS256 secret (switch to EdDSA/RS256 for prod if you can)
const JWT_SECRET = process.env["JWT_SECRET"]!
const ENC_KEY = new TextEncoder().encode(JWT_SECRET)

// Optional app-wide pepper for refresh tokens
const REFRESH_PEPPER = process.env["REFRESH_PEPPER"] ?? ""
const INVITE_TOKEN_PEPPER = process.env["INVITE_TOKEN_PEPPER"] ?? ""

// ---- helpers ----
function nowSeconds() {
  return Math.floor(Date.now() / 1000)
}

export async function generateAccessToken(user: PublicUser): Promise<string> {
  const jti = crypto.randomUUID()
  const iat = nowSeconds()

  const tokenUser: TokenUser = {
    sub: user.id.toString(),
    teams: user.teams.map(team => ({
      roles: team.roles.map(role => ({ role: role.role, guardianOfId: role.guardianOf })),
      teamId: team.teamId
    })) as MinimalTeamUser[],
    jti,
    forcePasswordChange: user.forcePasswordChange
  }

  const tokenPayload = tokenUser as unknown as JWTPayload;

  return await new SignJWT(tokenPayload)
    .setProtectedHeader({ alg: "HS256", typ: "JWT" })
    .setIssuedAt(iat)
    .setIssuer(ISS)
    .setAudience(AUD)
    .setExpirationTime(iat + ACCESS_TTL_SEC)
    .sign(ENC_KEY)
}

export type RefreshTokenResult = {
  token: string
  hash: string
  jti: string
  expiresAt: Date
}

export async function generateRefreshToken(): Promise<RefreshTokenResult> {
  const token = crypto.randomBytes(64).toString("base64url")
  const jti = crypto.randomUUID()
  const expiresAt = new Date(Date.now() + REFRESH_TTL_SEC * 1000)
  const hash = hashRefreshToken(token)
  return { token, hash, jti, expiresAt }
}

// ---------- NEW: verification ----------

/** Verify an access JWT. Throws on invalid/expired. Returns payload (typed). */
export async function verifyToken<T extends { sub: string; jti?: string; role?: string }>(
  token: string
): Promise<T> {
  const { payload } = await jwtVerify(token, ENC_KEY, {
    issuer: ISS,
    audience: AUD,
    algorithms: ["HS256"],
  })
  // payload is a JOSE JWS payload; you can cast/narrow as needed
  return payload as T
}

/** Hash a refresh token (with pepper) for DB storage/compare. */
export function hashRefreshToken(token: string): string {
  return crypto.createHash("sha256").update(token + REFRESH_PEPPER, "utf8").digest("base64url")
}

export function hashInviteToken(token: string): string {
  return crypto.createHash("sha256").update(token + INVITE_TOKEN_PEPPER, "utf8").digest("base64url")
}

/** Constant-time check of a presented refresh token against stored hash. */
export function verifyRefreshToken(presentedToken: string, storedHash: string): boolean {
  const calc = hashRefreshToken(presentedToken)
  // timingSafeEqual requires equal length buffers
  const a = Buffer.from(calc)
  const b = Buffer.from(storedHash)
  return a.length === b.length && crypto.timingSafeEqual(a, b)
}

// --- Cookie helpers ---

// Compute cross-site cookie settings depending on environment
export function getCookieOptionsBase() {
  const isProdLike = process.env['NODE_ENV'] !== 'development'
  const sameSite: 'lax' | 'strict' | 'none' = isProdLike ? 'none' : 'lax'
  const domain = process.env['NODE_ENV'] !== 'development' ? '.valkku.ai' : null
  return { isProdLike, sameSite, domain }
}

// Attach refresh token cookie to response
export function attachRefreshCookie(res: any, token: string, expiresAt: Date) {
  const { isProdLike, sameSite, domain } = getCookieOptionsBase()

  res.set('Cache-Control', 'no-store')
  res.set('Pragma', 'no-cache')
  res.set('Expires', '0')

  res.cookie('rtid', token, {
    httpOnly: true,
    secure: isProdLike,
    sameSite,
    domain,
    path: '/api/auth/refresh',
    maxAge: Math.max(0, new Date(expiresAt).getTime() - Date.now())
  })
}

// Clear refresh token cookie from response
export function clearRefreshCookie(res: any) {
  const { isProdLike, sameSite, domain } = getCookieOptionsBase()

  res.clearCookie("rtid", {
    httpOnly: true,
    secure: isProdLike,
    sameSite,
    domain,
    path: "/api/auth/refresh"
  })
}
