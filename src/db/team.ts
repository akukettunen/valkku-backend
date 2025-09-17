import { query } from '@/db/index';
import { NORMAL_ROLES, ROLES } from '@/schemas/team';
import { UserInTeam } from '@/types/user';
import { Team, TeamUserRole } from '@/types/team';
import { Invite, TeamUser, PublicInvite } from '@/types/team';

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
  return query(`
    INSERT INTO team_user_roles (teamId, userId, role, guardianOf) VALUES (?, ?, ?, ?)
  `, [teamId, userId, role, guardianOf || null]);
};

export const getTeamUsers = async (teamId: string) => {
  const result = await query(`
    SELECT
      team_users.userId,
      team_users.createdAt,
      users.firstName,
      users.lastName,
      users.email
    FROM team_users
    LEFT JOIN users ON team_users.userId = users.id
    WHERE team_users.teamId = ?
  `, [teamId])

  return result as UserInTeam[];
};

export const getTeamUserRoles = async (teamId: string, userId: string) => {
  const result = await query(`
    SELECT role, guardianOf, createdAt, updatedAt FROM team_user_roles WHERE teamId = ? AND userId = ?
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
    SELECT userId, teamId, teams.name as teamName, users.email, team_users.createdAt FROM team_users
    LEFT JOIN teams ON teams.id = team_users.teamId
    LEFT JOIN users ON users.id = team_users.userId
    WHERE teamId = ? AND userId = ?;
  `, [teamId, userId])

  return result as TeamUser[];
}

export const getTeamUserRole = async (
  teamId: string,
  userId: string,
  role: ROLES,
  guardianOf?: string
) => {
  let queryStr = `
    SELECT role, guardianOf, createdAt, updatedAt
    FROM team_user_roles
    WHERE teamId = ? AND userId = ? AND role = ?
  `;

  const params: any[] = [teamId, userId, role];

  if (guardianOf === undefined) {
    queryStr += " AND guardianOf IS NULL";
  } else {
    queryStr += " AND guardianOf = ?";
    params.push(guardianOf);
  }

  const result = await query(queryStr, params);
  return result as TeamUserRole[];
};

export const createInvite = async ({ userId, teamId, role, guardianOf, tokenHash, invitedBy, validUntil }: Invite) => {
  return query(`
    INSERT INTO invites (userId, teamId, role, guardianOf, tokenHash, invitedBy, validUntil) VALUES (?, ?, ?, ?, ?, ?, ?)
  `, [userId, teamId, role, guardianOf, tokenHash, invitedBy, validUntil])
};

export const getInvite = async (teamId: string, userId: string) => {
  const result = await query(`
    SELECT invites.createdAt, users.id as userId, invites.validUntil, invites.role, invites.guardianOf, users.firstName, users.lastName, users.email, invitedByUser.firstName as invitedByFirstName, invitedByUser.lastName as invitedByLastName FROM invites
    LEFT JOIN users ON invites.userId = users.id
    LEFT JOIN users as invitedByUser ON invites.invitedBy = invitedByUser.id
    WHERE invites.teamId = ? AND invites.userId = ?
  `, [teamId, userId])

  return result as PublicInvite[];
}

export const getInviteWithRole = async (teamId: string, userId: string, role: NORMAL_ROLES) => {
  const result = await query(`
    SELECT invites.createdAt, users.id as userId, invites.validUntil, invites.role, invites.guardianOf, users.firstName, users.lastName, users.email, invitedByUser.firstName as invitedByFirstName, invitedByUser.lastName as invitedByLastName FROM invites
    LEFT JOIN users ON invites.userId = users.id
    LEFT JOIN users as invitedByUser ON invites.invitedBy = invitedByUser.id
    WHERE invites.teamId = ? AND invites.userId = ? AND invites.role = ?
  `, [teamId, userId, role])

  return result as PublicInvite[];
}

export const getInvitesByTeamId = async (teamId: string) => {
  const result = await query(`
    SELECT invites.createdAt, users.id as userId, invites.validUntil, invites.role, invites.guardianOf, users.firstName, users.lastName, users.email FROM invites
    LEFT JOIN users ON invites.userId = users.id
    WHERE invites.teamId = ?
  `, [teamId])

  return result as PublicInvite[];
}

export const deleteInvite = async (id: number) => {
  return query(`
    DELETE FROM invites WHERE id = ?
  `, [id])
}

export const getInviteByTokenHash = async (tokenHash: string) => {
  const result = await query(`
    SELECT * FROM invites WHERE tokenHash = ?
  `, [tokenHash])

  return result as Invite[];
}