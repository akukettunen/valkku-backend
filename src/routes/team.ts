import { Router, Request, Response } from 'express';
import { validate } from '@/middleware/validation';
import { createTeamSchema } from '@/schemas/team';
import { createTeam, createTeamUser, createTeamUserRole, getInviteWithRole, getTeamById, getTeamTeamUserRoles, getInviteByTokenHash } from '@/db/team';
import { getUserById, getUserByEmail, createUser } from '@/db/user';
import { PublicUser, User } from '@/types/user';
import { getTeamUsers, getTeamUser, getInvitesByTeamId, deleteInvite, getTeamUserRole } from '@/db/team';
import { getPublicUserById } from '@/utils/userHelper';
import { requireSignedIn, requireScope } from '@/middleware/auth';
import { inviteUserSchema } from '@/schemas/team';
import { AppError } from '@/middleware/errors';
import { hashInviteToken } from '@/utils/tokenHelper';
import { generateAccessToken } from '@/utils/tokenHelper';
import { inviteUser } from '@/utils/inviteHelper';
import { createId } from '@/utils/userHelper';

const router: Router = Router();

router.post('/', requireSignedIn, validate(createTeamSchema), async (req: Request, res: Response) => {
  const { name } = req.body;

  const newTeamId = createId();
  await createTeam({ id: newTeamId, name });
  const [ user ] = await getUserById(req.user?.sub!) as User[];
  const [ team ] = await getTeamById(newTeamId);

  console.log("team", team)
  console.log("user", user)
  console.log("team", team!.id)
  console.log(newTeamId)

  if(!user) {
    return res.status(404).json({
      success: false,
      message: 'User not found',
      code: 'something_went_wrong'
    });
  }

  await createTeamUser(newTeamId, user.id);
  await createTeamUserRole(newTeamId, user.id, 'owner');

  const publicUser = await getPublicUserById(req.user?.sub!, null) as PublicUser;
  const accessToken = await generateAccessToken(publicUser)

  return res.status(201).json({
    success: true,
    message: 'Team created successfully',
    data: {
      user: publicUser,
      token: accessToken,
      team
    }
  });
});

router.get('/:teamId/users', requireSignedIn, requireScope('membership:read', 'team'), async (req: Request, res: Response) => {
  const { teamId } = req.params;

  if(!teamId) {
    return res.status(400).json({
      success: false,
      message: 'Team ID is required',
      code: 'something_went_wrong'
    });
  }

  const users = await getTeamUsers(teamId);
  const roles = await getTeamTeamUserRoles(teamId);

  const publicUsers = users.map((user) => {
    return {
      ...user,
      roles: roles.filter((role) => role.userId === user.userId)
    }
  });

  return res.status(200).json({
    success: true,
    message: 'Team users fetched successfully',
    code: 'team_users_fetched_successfully',
    data: publicUsers
  });
});

router.get('/:teamId/invites', requireSignedIn, requireScope('membership:read', 'team'), async (req: Request, res: Response) => {
  const { teamId } = req.params;

  const invites = await getInvitesByTeamId(teamId!);

  return res.status(200).json({
    success: true,
    message: 'Invites fetched successfully',
    code: 'invites_fetched_successfully',
    data: invites
  });
});

router.post('/:teamId/invite', requireSignedIn, requireScope('membership:create', 'team'), validate(inviteUserSchema), async (req: Request, res: Response) => {
  const { teamId } = req.params;
  let { firstName, lastName, email, preferredLanguage, role, guardianOf, guardians } = req.body;
  email = email.toLowerCase().trim();

  if(!teamId) {
    throw new AppError('Invalid team ID', 400, 'something_went_wrong');
  }

  const [ team ] = await getTeamById(teamId);
  if(!team) {
    throw new AppError('Team not found', 404, 'something_went_wrong');
  }

  const [ invitedUser ] = await getUserByEmail(email);

  if(guardianOf) {
    const [ guardianOfUser ] = await getTeamUser(teamId, guardianOf);
    if(!guardianOfUser) {
      throw new AppError('Guardian of user not found', 404, 'guardian_of_user_not_found');
    }
  }

  let teamUser;
  if(invitedUser) {
    // If user exists, check if they are in the team and not invited
    [ teamUser ] = await getTeamUser(teamId, invitedUser.id);
    if(teamUser) {
      throw new AppError('User already in team', 400, 'user_already_in_team');
    }

    const [ invite ] = await getInviteWithRole(teamId, invitedUser.id, role);
    const guardianInvites = await getInviteWithRole(teamId, invitedUser.id, 'guardian');
    if(invite && role !== 'guardian') {
      throw new AppError('User already invited to team', 400, 'user_already_invited_to_team');
    }
    if(guardianInvites.some(i => i.guardianOf === guardianOf)) {
      throw new AppError('Guardian already invited to team', 400, 'guardian_already_invited_to_team_for_this_user');
    }
  }

  let invitedUserId;
  if(!invitedUser) {
    // If no user, create one
    const id = createId();
    await createUser({ id, email, firstName, lastName, preferredLanguage, passwordHash: null }) as any;
    invitedUserId = id;
  } else {
    invitedUserId = invitedUser.id;
  }

  const publicInvite = await inviteUser(invitedUserId, teamId, role, req.user?.sub!, guardianOf);

  // Handle guardians creation
  if(guardians) {
    for(const guardian of guardians) {
      let guardianId;
      if(guardian.userId) {
        const guardianInvites = await getInviteWithRole(teamId, guardian.userId, 'guardian');
        if(guardianInvites.some(i => i.guardianOf === invitedUserId)) {
          throw new AppError('Guardian already invited to team', 400, 'guardian_already_invited_to_team_for_this_user');
        }
        await createTeamUserRole(teamId, guardian.userId, 'guardian', invitedUserId);
        guardianId = guardian.userId;
      } else {
        const [ user ] = await getUserByEmail(guardian.email);
        if(user) {
          throw new AppError('User with this email already exists', 400, 'user_with_this_email_already_exists');
        }
        guardianId = createId();
        await createUser({ id: guardianId, email: guardian.email.trim(), firstName: guardian.firstName, lastName: guardian.lastName, preferredLanguage: guardian.preferredLanguage, passwordHash: null });
      }
      if(guardianId === invitedUserId) {
        throw new AppError('Guardian cannot be the same as the user', 400, 'guardian_cannot_be_the_same_as_the_user');
      }

      await inviteUser(guardianId, teamId, 'guardian', req.user?.sub!, invitedUserId);
    }
  }

  res.status(201).json({
    success: true,
    message: 'Invite created successfully',
    code: 'invite_created_successfully',
    data: {
      invite: publicInvite
    }
  });
});

router.post('/join', requireSignedIn, async (req: Request, res: Response) => {
  const { token } = req.body;

  const tokenHash = hashInviteToken(token)
  const [ invite ] = await getInviteByTokenHash(tokenHash);

  if(!invite) {
    throw new AppError('Invite not found', 404, 'invalid_invite');
  }

  if(invite.validUntil < new Date()) {
    throw new AppError('Invite expired', 400, 'invalid_invite');
  }

  console.log("invite", invite)
  const [ teamUser ] = await getTeamUser(invite.teamId, invite.userId);

  if(!teamUser) {
    await createTeamUser(invite.teamId, invite.userId);
  }

  const [ teamUserRole ] = await getTeamUserRole(invite.teamId, invite.userId, invite.role, invite.guardianOf ?? undefined);
  if(teamUserRole) {
    throw new AppError('User already in team with role', 400, 'user_already_in_team_with_role');
  }

  await createTeamUserRole(invite.teamId, invite.userId, invite.role, invite.guardianOf ?? undefined);

  await deleteInvite(invite.id!);

  return res.status(200).json({
    success: true,
    message: 'User joined team successfully',
    code: 'user_joined_team_successfully'
  });
});

// CUCKED - WE SHOULD GET INVITES NOT USER ROLES DUH
// router.delete('/:teamId/user/:userId/invite', requireSignedIn, requireScope('membership:remove', 'team'), async (req: Request, res: Response) => {
//   const { teamId, userId } = req.params;

//   const userTeamRoles = await getTeamUserRoles(teamId!, userId!);

//   if(userTeam.role === 'owner') {
//     throw new AppError('Owner cannot be removed from team', 400, 'owner_cannot_be_removed_from_team');
//   }

//   await deleteInvite(teamId!, userId!);

//   return res.status(200).json({
//     success: true,
//     message: 'Invite deleted successfully',
//     code: 'invite_deleted_successfully'
//   });
// });

export default router;
do not