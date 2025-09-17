import { query } from '@/db/index';
import { TeamUser, TeamUserRole } from '@/types/team';
import { PREFERRED_LANGUAGE, User } from '@/types/user';
import { AppError } from '@/middleware/errors';

export const putUserDetails = async (user: { firstName: string; lastName: string }) => {
  const { firstName, lastName } = user;
  const result = await query(`
    INSERT INTO users (firstName, lastName) VALUES (?, ?)
  `, [firstName, lastName]);
  return result;
};

export const getUserById = async (id: string) => {
  if(id.length !== 12) {
    throw new AppError('Invalid user id', 400, 'invalid_user_id');
    return null;
  }

  const result = await query('SELECT * FROM users WHERE id = ?', [id]);
  return result;
};

export const initializeUser = async (auth0Id: string) => {
  const result = await query(`
    INSERT INTO users (auth0Id, firstName, lastName, pendingDetails, emojiClickedCount, createdAt, updatedAt)
    VALUES (?, ?, ?, ?, ?, NOW(), NOW())
  `, [auth0Id, '', '', true, 0]);
  return result;
};

export const updateUser = async (emojiClickedCount: number, id: string) => {
  const result = await query(`
    UPDATE users SET emojiClickedCount = ? WHERE id = ?
  `, [emojiClickedCount, id]);
  return result;
};

export const updateUserDetails = async (updates: { emojiClickedCount?: number; firstName?: string; lastName?: string; preferredLanguage?: PREFERRED_LANGUAGE }, id: string) => {
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
  if (updates.preferredLanguage !== undefined) {
    fields.push('preferredLanguage = ?');
    values.push(updates.preferredLanguage);
  }

  values.push(id);

  const result = await query(`
    UPDATE users SET ${fields.join(', ')}, updatedAt = NOW() WHERE id = ?
  `, values);
  return result;
};

export const getUserTeams = async (userId: string) => {
  const result = await query(`
    SELECT
      team_users.userId,
      team_users.teamId,
      teams.name as teamName,
      team_users.createdAt
    FROM team_users
    LEFT JOIN teams ON team_users.teamId = teams.id
    WHERE team_users.userId = ?;
  `, [userId]);
  return result as TeamUser[];
};

export const getUserTeamRoles = async (userId: string) => {
  const result = await query(`
    SELECT userId, teamId, role, guardianOf, createdAt, updatedAt FROM team_user_roles WHERE userId = ?
  `, [userId])
  return result as TeamUserRole[];
}

export const createUser = async (user: { id: string; email: string; passwordHash: string | null; firstName: string; lastName: string; preferredLanguage: 'fi' | 'en' }) => {
  const { id, email, passwordHash, firstName, lastName, preferredLanguage } = user;

  const result = await query(`
    INSERT INTO users (id, email, passwordHash, firstName, lastName, preferredLanguage) VALUES (?, ?, ?, ?, ?, ?)
  `, [id, email, passwordHash, firstName, lastName, preferredLanguage]);
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