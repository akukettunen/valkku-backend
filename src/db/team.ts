import { query } from '@/db/index';
import { ROLES } from '@/schemas/team';

export const createTeam = async (name: string) => {
  return query(`
    INSERT INTO teams (name) VALUES (?)
  `, [name]) as any;
};

export const createTeamUser = async (teamId: number, userId: number, role: ROLES) => {
  return query(`
    INSERT INTO team_users (teamId, userId, role) VALUES (?, ?, ?)
  `, [teamId, userId, role]);
};

export const getTeamUserByAuth0IdAndTeamId = async (auth0Id: string, teamId: number) => {
  return query(`
    SELECT team_users.* FROM team_users
    LEFT JOIN users ON team_users.userId = users.id
    WHERE users.auth0Id = ? AND team_users.teamId = ?
  `, [auth0Id, teamId]);
};