import { query } from '@/db/index';
import { TeamUser, TeamUserRole } from '@/types/team';
import { PREFERRED_LANGUAGE, User } from '@/types/user';
import { AppError } from '@/middleware/errors';
import { ROLES } from '@/types/team';

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
  }

  const result = await query('SELECT * FROM users WHERE id = ?', [id]);
  return result as User[];
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

export const updateUserDetails = async (updates: { emojiClickedCount?: number; firstName?: string; lastName?: string; preferredLanguage?: PREFERRED_LANGUAGE; notificationToken?: string | null }, id: string) => {
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
  if (updates.notificationToken !== undefined) {
    fields.push('notificationToken = ?');
    values.push(updates.notificationToken);
  }

  values.push(id);

  const result = await query(`
    UPDATE users SET ${fields.join(', ')}, updatedAt = NOW() WHERE id = ?
  `, values);
  return result;
};

export const setForcePasswordChange = async (userId: string, forcePasswordChange: boolean) => {
  const result = await query(`
    UPDATE users SET forcePasswordChange = ? WHERE id = ?
  `, [forcePasswordChange, userId]);
  return result;
};

export const getUserTeams = async (userId: string) => {
  const result = await query(`
    SELECT
      team_users.userId,
      team_users.teamId,
      teams.name as teamName,
      team_users.createdAt,
      team_users.status
    FROM team_users
    LEFT JOIN teams ON team_users.teamId = teams.id
    WHERE team_users.userId = ?;
  `, [userId]);
  return result as TeamUser[];
};

export const getUserTeam = async (userId: string, teamId: string) => {
  const result = await query(`
    SELECT * FROM team_users WHERE userId = ? AND teamId = ?
  `, [userId, teamId]);
  return result as TeamUser[];
};

export const getUserTeamRoles = async (userId: string) => {
  const result = await query(`
    SELECT
      team_user_roles.userId,
      team_user_roles.teamId,
      team_user_roles.role,
      team_user_roles.guardianOf,
      team_user_roles.createdAt,
      team_user_roles.updatedAt,
      guardee.email as guardianOfEmail,
      guardee.fullName as guardianOfFullName
    FROM team_user_roles
    LEFT JOIN users as guardee ON guardee.id = team_user_roles.guardianOf
    WHERE userId = ?
  `, [userId])
  return result as TeamUserRole[];
}

export const getUserTeamRole = async (userId: string, teamId: string, role: ROLES, guardianOf?: string) => {
  if(guardianOf) {
    const result = await query(`
      SELECT * FROM team_user_roles WHERE userId = ? AND teamId = ? AND role = ? AND guardianOf = ?
    `, [userId, teamId, role, guardianOf]);
    return result as TeamUserRole[];
  } else {
    const result = await query(`
      SELECT * FROM team_user_roles WHERE userId = ? AND teamId = ? AND role = ?
    `, [userId, teamId, role]);
    return result as TeamUserRole[];
  }
};


export const createUser = async (user: { id: string; email: string; passwordHash: string | null; emailConfirmed: boolean; firstName?: string | undefined; lastName?: string | undefined; preferredLanguage: 'fi' | 'en', forcePasswordChange: boolean }) => {
  const { id, email, passwordHash, emailConfirmed, firstName, lastName, preferredLanguage, forcePasswordChange } = user;

  const result = await query(`
    INSERT INTO users (id, email, passwordHash, emailConfirmed, firstName, lastName, preferredLanguage, forcePasswordChange) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `, [id, email, passwordHash, emailConfirmed, firstName, lastName, preferredLanguage, forcePasswordChange]);
  return result;
};

export const deleteUser = async (userId: string) => {
  const result = await query(`
    DELETE FROM users WHERE id = ?
  `, [userId]);
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

export const updateUserPassword = async (userId: string, newPasswordHash: string) => {
  const result = await query(`
    UPDATE users
    SET passwordHash = ?
    WHERE id = ?
  `, [newPasswordHash, userId]);
  return result;
};