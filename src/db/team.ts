import { query } from '@/db/index';
import { ROLES } from '@/schemas/team';
import { UserInTeam } from '@/types/user';
import { Team, TeamUserRole } from '@/types/team';
import { TeamUser } from '@/types/team';

export const createTeam = async ({ id, name }: { id: string, name: string}) => {
  return query(`
    INSERT INTO teams (id, name) VALUES (?, ?)
  `, [id, name]) as any;
};

export const getTeamById = async (id: string) => {
  const result = await query(`
    SELECT * FROM teams WHERE id = ?
  `, [id]) as any;

  return result as Team[];
};

export const createTeamUser = async (teamId: string, userId: string) => {
  return query(`
    INSERT INTO team_users (teamId, userId) VALUES (?, ?)
  `, [teamId, userId]);
};

export const createTeamUserRole = async (teamId: string, userId: string, role: ROLES, guardianOf?: string) => {
  if (guardianOf) {
    return query(`
      INSERT INTO team_user_roles (teamId, userId, role, guardianOf) VALUES (?, ?, ?, ?)
    `, [teamId, userId, role, guardianOf]);
  } else {
    return query(`
      INSERT INTO team_user_roles (teamId, userId, role) VALUES (?, ?, ?)
    `, [teamId, userId, role]);
  }
};

export const getTeamUsers = async (teamId: string) => {
  const result = await query(`
    SELECT
      team_users.userId,
      team_users.createdAt,
      team_users.updatedAt,
      team_users.status,
      users.firstName,
      users.lastName,
      users.fullName,
      users.email,
      users.preferredLanguage,
      users.emailConfirmed,
      users.profilePictureUrl,
      users.emojiClickedCount
    FROM team_users
    LEFT JOIN users ON team_users.userId = users.id
    WHERE team_users.teamId = ?
  `, [teamId])

  return result as UserInTeam[];
};

export const getTeamUserRoles = async (teamId: string, userId: string) => {
  const result = await query(`
    SELECT role, guardianOf, createdAt, updatedAt, guardianOfThisUser.email as guardianOfEmail
    FROM team_user_roles
    LEFT JOIN users AS guardianOfThisUser ON team_user_roles.guardianOf = guardianOfThisUser.id
    WHERE teamId = ? AND userId = ?
  `, [teamId, userId])

  return result as TeamUserRole[];
}

export const getTeamTeamUserRoles = async (teamId: string) => {
  const result = await query(`
    SELECT userId, role, guardianOf, createdAt, updatedAt FROM team_user_roles WHERE teamId = ?
  `, [teamId])

  return result as TeamUserRole[];
}

export const getTeamUser = async (teamId: string, userId: string) => {
  const result = await query(`
    SELECT userId, teamId, status, invitedBy, validUntil, teams.name as teamName, users.email, team_users.createdAt FROM team_users
    LEFT JOIN teams ON teams.id = team_users.teamId
    LEFT JOIN users ON users.id = team_users.userId
    WHERE teamId = ? AND userId = ?;
  `, [teamId, userId])

  return result as TeamUser[];
}

export const getTeamUserRole = async (
  teamId: string,
  userId: string,
) => {
  let queryStr = `
    SELECT role, guardianOf, createdAt, updatedAt
    FROM team_user_roles
    WHERE teamId = ? AND userId = ?
  `;

  const params: any[] = [teamId, userId];

  queryStr += " AND guardianOf IS NULL";

  const result = await query(queryStr, params);
  return result as TeamUserRole[];
};