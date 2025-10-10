import crypto from 'crypto';
import { query } from '@/db/index';
import { hashInviteToken } from '@/utils/tokenHelper';
import { TeamUser, TeamUserRole } from '@/types/team';
import { NORMAL_ROLES } from '@/schemas/team';
import { getUserByEmail, getUserById } from '@/db/user';
import { PublicUser, User } from '@/types/user';
import { getUserTeam, getUserTeamRole } from '@/db/user';
import { PREFERRED_LANGUAGE } from '@/types/user';
import { getPublicUserById } from './userHelper';
import { getTeamById, getTeamUserRoles } from '@/db/team';
import { sendTeamInvitationEmail } from '@/utils/emailHelper';
import { AppError } from '@/middleware/errors';

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

  const userTeamRoles = await getTeamUserRoles(teamId, user.id);
  if(userTeamRoles.length && userTeamRoles.some(r => r.role !== 'guardian')) {
    return {
      canBeInvited: false,
      userToBeCreated: false,
      userTeamToBeCreated: false,
      publicUser
    };
  }

  return {
    canBeInvited: true,
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
export const inviteUserToTeamAndSendEmail = async (userId: string, teamId: string, invitedBy: string, role: NORMAL_ROLES) => {
  const token = crypto.randomBytes(64).toString("base64url")
  const tokenHash = hashInviteToken(token)
  const validUntil = new Date(Date.now() + 1000 * 60 * 60 * 24 * 30); // 30 days
  await query('INSERT INTO email_token_raw_values_delete_in_prod (userId, rawTokenDanger) VALUES (?, ?)', [userId, token])

  await query(`
    INSERT INTO team_users (teamId, userId, invitedBy, validUntil, status, tokenHash) VALUES (?, ?, ?, ?, ?, ?)
  `, [teamId, userId, invitedBy, validUntil, 'invited', tokenHash])

  const [ invitedUser ] = await getUserById(userId);
  const [ invitor ] = await getUserById(invitedBy)
  const [ team ] = await getTeamById(teamId)

  if(!invitedUser || !invitor || !team) {
    throw new AppError('User or team not found', 404, 'user_or_team_not_found');
  }

  await sendTeamInvitationEmail(invitedUser.email, team.name, invitor.fullName || '', token, role, invitedUser.firstName || '', invitedUser.preferredLanguage);
}