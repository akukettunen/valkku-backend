import { query } from '@/db/index'

type Session = {
  jti: string
  userId: string
  refreshHash: string
  createdAt: Date
  expiresAt: Date
  replacedBy?: string | null
  revokedAt?: Date | null
  ip?: string | null
  userAgent?: string | null
  lastUsedAt?: Date | null
}

type NewSession = {
  jti: string
  userId: string
  refreshHash: string
  expiresAt: Date
  ip?: string | null
  userAgent?: string | null
}

export const createSession = async (s: NewSession) => {
  const { jti, userId, refreshHash, expiresAt, ip, userAgent } = s
  await query(
    `
    INSERT INTO sessions (
      jti, userId, refreshHash,
      createdAt, expiresAt,
      replacedBy, revokedAt,
      ip, userAgent, lastUsedAt
    )
    VALUES (?, ?, ?, NOW(3), ?, NULL, NULL, ?, ?, NOW(3))
    `,
    [jti, userId, refreshHash, expiresAt, ip ?? null, userAgent ?? null]
  )
  return { ok: true, jti }
}

// ---- lookups ----
export const findSessionByHash = async (hash: string): Promise<Session | null> => {
  const rows = await query(
    `SELECT * FROM sessions WHERE refreshHash = ? LIMIT 1`,
    [hash]
  ) as Session[]
  return rows[0] || null
}

export const findSessionByJti = async (jti: string): Promise<Session | null> => {
  const rows = await query(
    `SELECT * FROM sessions WHERE jti = ? LIMIT 1`,
    [jti]
  ) as Session[];

  return rows[0] || null
}

// ---- updates ----
export const linkReplacedSession = async (oldJti: string, newJti: string) => {
  return await query(
    `UPDATE sessions SET replacedBy = ? WHERE jti = ?`,
    [newJti, oldJti]
  )
}

export const revokeSession = async (jti: string) => {
  return await query(
    `UPDATE sessions SET revokedAt = NOW(3) WHERE jti = ?`,
    [jti]
  )
}

export const revokeSessionChain = async (userId: string, rootJti: string) => {
  // simple version: revoke this user’s session + descendants (if you want chain handling)
  return await query(
    `UPDATE sessions SET revokedAt = NOW(3) WHERE userId = ? AND (jti = ? OR replacedBy = ?)`,
    [userId, rootJti, rootJti]
  )
}

export const touchSession = async (jti: string) => {
  return await query(
    `UPDATE sessions SET lastUsedAt = NOW(3) WHERE jti = ?`,
    [jti]
  )
}

export const revokeAllUserSessions = async (userId: string) => {
  return await query(
    `UPDATE sessions SET revokedAt = NOW(3) WHERE userId = ? AND revokedAt IS NULL`,
    [userId]
  )
}
