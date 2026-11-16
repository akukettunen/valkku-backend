import { query, Transaction } from '@/db/index';

export type PasswordResetRow = {
  id: number;
  userId: string;
  tokenHash: string;
  createdAt: string; // DATETIME as string due to dateStrings
  expiresAt: string;
  used: 0 | 1;
  usedAt: string | null;
}

export const createPasswordReset = async (userId: string, tokenHash: string, expiresAt: Date) => {
  const result = await query(
    `
    INSERT INTO password_resets (userId, tokenHash, expiresAt)
    VALUES (?, ?, ?)
    `,
    [userId, tokenHash, expiresAt]
  );
  return result as any;
};

export const findByTokenHash = async (tokenHash: string): Promise<PasswordResetRow | null> => {
  const rows = await query(
    `SELECT * FROM password_resets WHERE tokenHash = ? LIMIT 1`,
    [tokenHash]
  ) as PasswordResetRow[];
  return rows[0] || null;
};

export const invalidateAllForUser = async (userId: string) => {
  return await query(
    `UPDATE password_resets SET used = TRUE, usedAt = NOW(3) WHERE userId = ? AND used = FALSE`,
    [userId]
  );
};

export const markUsedById = async (id: number) => {
  return await query(
    `UPDATE password_resets SET used = TRUE, usedAt = NOW(3) WHERE id = ? AND used = FALSE`,
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
  const expiresAt = new Date(row.expiresAt);
  if (expiresAt.getTime() < now.getTime()) {
    throw new Error('reset_expired');
  }

  await tr.query(
    `UPDATE users SET passwordHash = ? WHERE id = ?`,
    [newPasswordHash, userId]
  );

  await tr.query(
    `UPDATE password_resets SET used = TRUE, usedAt = NOW(3) WHERE id = ?`,
    [resetId]
  );
};
