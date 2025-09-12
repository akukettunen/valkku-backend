import { query } from '@/db/index';
import { TeamUser } from '@/types/team';
import { User } from '@/types/user';

export const putUserDetails = async (user: { firstName: string; lastName: string }) => {
  const { firstName, lastName } = user;
  const result = await query(`
    INSERT INTO users (firstName, lastName) VALUES (?, ?)
  `, [firstName, lastName]);
  return result;
};

export const getUserById = async (id: number) => {
  const result = await query('SELECT * FROM users WHERE id = ?', [id]);
  return result;
};

export const getUserByAuth0Id = async (auth0Id: string) => {
  return query('SELECT * FROM users WHERE auth0Id = ?', [auth0Id]);
};

export const initializeUser = async (auth0Id: string) => {
  const result = await query(`
    INSERT INTO users (auth0Id, firstName, lastName, pendingDetails, emojiClickedCount, createdAt, updatedAt)
    VALUES (?, ?, ?, ?, ?, NOW(), NOW())
  `, [auth0Id, '', '', true, 0]);
  return result;
};

export const updateUser = async (emojiClickedCount: number, id: number) => {
  const result = await query(`
    UPDATE users SET emojiClickedCount = ? WHERE id = ?
  `, [emojiClickedCount, id]);
  return result;
};

export const updateUserDetails = async (updates: { emojiClickedCount?: number; firstName?: string; lastName?: string; pendingDetails?: boolean }, id: number) => {
  const fields = [];
  const values = [];

  if (updates.emojiClickedCount !== undefined) {
    fields.push('emojiClickedCount = ?');
    values.push(updates.emojiClickedCount);
  }
  if (updates.firstName !== undefined) {
    fields.push('firstName = ?');
    values.push(updates.firstName);
  }
  if (updates.lastName !== undefined) {
    fields.push('lastName = ?');
    values.push(updates.lastName);
  }
  if (updates.pendingDetails !== undefined) {
    fields.push('pendingDetails = ?');
    values.push(updates.pendingDetails);
  }

  values.push(id);

  const result = await query(`
    UPDATE users SET ${fields.join(', ')}, updatedAt = NOW() WHERE id = ?
  `, values);
  return result;
};

export const getUserTeams = async (userId: number) => {
  const result = await query(`
    SELECT
      team_users.userId,
      team_users.teamId,
      teams.name as teamName,
      team_users.role,
      team_users.createdAt as joinedAt
    FROM team_users
    LEFT JOIN teams ON team_users.teamId = teams.id
    WHERE team_users.userId = ?;
  `, [userId]);
  return result as TeamUser[];
};

export const createUser = async (user: { email: string; passwordHash: string; firstName: string; lastName: string; preferredLanguage: 'fi' | 'en' }) => {
  const { email, passwordHash, firstName, lastName, preferredLanguage } = user;

  const result = await query(`
    INSERT INTO users (email, passwordHash, firstName, lastName, preferredLanguage) VALUES (?, ?, ?, ?, ?)
  `, [email, passwordHash, firstName, lastName, preferredLanguage]);
  return result;
};

export const getUserByEmail = async (email: string) => {
  const result = await query('SELECT * FROM users WHERE emailLc = ?', [email.toLowerCase().trim()]);
  return result as User[];
};

export const revokeSession = async (jti: string) => {
  await query(
    `UPDATE sessions SET revokedAt = NOW(3) WHERE jti = ? AND revokedAt IS NULL`,
    [jti]
  )
  return { ok: true, jti }
}