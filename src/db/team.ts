import { query } from '@/db/index';
import { ROLES } from '@/schemas/team';
import { UserInTeam } from '@/types/user';
import { Team } from '@/types/team';

export const createTeam = async (name: string) => {
  return query(`
    INSERT INTO teams (name) VALUES (?)
  `, [name]) as any;
};

export const getTeamById = async (id: number) => {
  const result = await query(`
    SELECT * FROM teams WHERE id = ?
  `, [id]) as any;

  return result as Team[];
};

export const createTeamUser = async (teamId: number, userId: number, role: ROLES) => {
  return query(`
    INSERT INTO team_users (teamId, userId, role) VALUES (?, ?, ?)
  `, [teamId, userId, role]);
};

export const getTeamUsers = async (teamId: number) => {
  const result = await query(`
    SELECT
      team_users.userId,
      team_users.role,
      team_users.createdAt as joinedAt,
      users.firstName,
      users.lastName,
      users.email
    FROM team_users
    LEFT JOIN users ON team_users.userId = users.id
    WHERE team_users.teamId = ?
  `, [teamId])

  return result as UserInTeam[];
};

export const getTeamUserByAuth0IdAndTeamId = async (auth0Id: string, teamId: number) => {
  return query(`
    SELECT team_users.* FROM team_users
    LEFT JOIN users ON team_users.userId = users.id
    WHERE users.auth0Id = ? AND team_users.teamId = ?
  `, [auth0Id, teamId]);
};