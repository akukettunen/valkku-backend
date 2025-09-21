import crypto from 'crypto';
import { query } from '@/db/index';
import { hashInviteToken } from '@/utils/tokenHelper';
import { TeamUser, TeamUserRole } from '@/types/team';
import { NORMAL_ROLES } from '@/schemas/team';
import { getUserByEmail } from '@/db/user';
import { PublicUser, User } from '@/types/user';
import { getUserTeam, getUserTeamRole } from '@/db/user';
import { PREFERRED_LANGUAGE } from '@/types/user';
import { getPublicUserById } from './userHelper';

export const userCanBeInvited = async (
  email: string,
  teamId: string,
  role: NORMAL_ROLES,
  guardianOf?: string
): Promise<{
  canBeInvited: boolean,
  userToBeCreated: boolean,
  userTeamToBeCreated: boolean,
  publicUser?: PublicUser
}> => {
  const [ user ] = await getUserByEmail(email) as User[];
  if(!user) {
    return {
      canBeInvited: true,
      userToBeCreated: true,
      userTeamToBeCreated: true
    };
  }

  if(role === 'guardian') {
    if(!guardianOf) {
      return {
        canBeInvited: false,
        userToBeCreated: false,
        userTeamToBeCreated: false
      }
    }
    const [ guardee ] = await getUserTeamRole(guardianOf, teamId, 'athlete') as TeamUserRole[];
    if(!guardee) {
      return {
        canBeInvited: false,
        userToBeCreated: false,
        userTeamToBeCreated: false
      }
    }
  }

  const publicUser = await getPublicUserById(user.id, null) as PublicUser;
  const [ userTeam ] = await getUserTeam(user.id, teamId) as TeamUser[];
  if(!userTeam) {
    return {
      canBeInvited: true,
      userToBeCreated: false,
      userTeamToBeCreated: true,
      publicUser
    };
  }

  return {
    canBeInvited: false,
    userToBeCreated: false,
    userTeamToBeCreated: false,
    publicUser
  }
}

/*
 * Creates a team user with invited status
 * @param userId - The ID of the user to invite
 * @param teamId - The ID of the team to invite the user to
 * @param invitedBy - The ID of the user who invited the user
 */
export const inviteUserToTeam = async (userId: string, teamId: string, invitedBy: string) => {
  const token = crypto.randomBytes(64).toString("base64url")
  const tokenHash = hashInviteToken(token)
  const validUntil = new Date(Date.now() + 1000 * 60 * 60 * 24 * 30); // 30 days
  await query('INSERT INTO email_token_raw_values_delete_in_prod (userId, rawTokenDanger) VALUES (?, ?)', [userId, token])

  await query(`
    INSERT INTO team_users (teamId, userId, invitedBy, validUntil, status, tokenHash) VALUES (?, ?, ?, ?, ?, ?)
  `, [teamId, userId, invitedBy, validUntil, 'invited', tokenHash])

  // TODO: add email send to outbox table and implement email sending
}