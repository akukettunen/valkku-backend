import { query, Transaction } from '@/db/index';

export type PasswordResetRow = {
  id: number;
  user_id: string;
  token_hash: string;
  created_at: string; // DATETIME as string due to dateStrings
  expires_at: string;
  used: 0 | 1;
  used_at: string | null;
}

export const createPasswordReset = async (userId: string, tokenHash: string, expiresAt: Date) => {
  const result = await query(
    `
    INSERT INTO password_resets (user_id, token_hash, expires_at)
    VALUES (?, ?, ?)
    `,
    [userId, tokenHash, expiresAt]
  );
  return result as any;
};

export const findByTokenHash = async (tokenHash: string): Promise<PasswordResetRow | null> => {
  const rows = await query(
    `SELECT * FROM password_resets WHERE token_hash = ? LIMIT 1`,
    [tokenHash]
  ) as PasswordResetRow[];
  return rows[0] || null;
};

export const invalidateAllForUser = async (userId: string) => {
  return await query(
    `UPDATE password_resets SET used = TRUE, used_at = NOW(3) WHERE user_id = ? AND used = FALSE`,
    [userId]
  );
};

export const markUsedById = async (id: number) => {
  return await query(
    `UPDATE password_resets SET used = TRUE, used_at = NOW(3) WHERE id = ? AND used = FALSE`,
    [id]
  );
};

export const finalizeResetTransaction = async (
  tr: Transaction,
  opts: { resetId: number; newPasswordHash: string; userId: string }
) => {
  const { resetId, newPasswordHash, userId } = opts;

  // Lock the reset row to ensure single use
  const rows = await tr.query(
    `SELECT * FROM password_resets WHERE id = ? FOR UPDATE`,
    [resetId]
  ) as PasswordResetRow[];

  const row = rows[0];
  if (!row) {
    throw new Error('reset_not_found');
  }
  if (row.used) {
    throw new Error('reset_already_used');
  }
  const now = new Date();
  const expiresAt = new Date(row.expires_at);
  if (expiresAt.getTime() < now.getTime()) {
    throw new Error('reset_expired');
  }

  await tr.query(
    `UPDATE users SET passwordHash = ? WHERE id = ?`,
    [newPasswordHash, userId]
  );

  await tr.query(
    `UPDATE password_resets SET used = TRUE, used_at = NOW(3) WHERE id = ?`,
    [resetId]
  );
};
