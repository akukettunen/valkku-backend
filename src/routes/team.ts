import { Router, Request, Response } from 'express';
import { z } from 'zod';
import { validate } from '@/middleware/validation';
import { createTeamSchema } from '@/schemas/team';
import { NORMAL_ROLES, ROLES } from '@/types/team';
import { createTeam, createTeamUser, createTeamUserRole, deleteTeamUserRolesForUser, deleteTeamUser, getTeamById, getTeamTeamUserRoles, deleteTeamUserRole, getTeamUserRolesForGuardian, getTeamUserByTokenHash, setUserTeamActive } from '@/db/team';
import { getUserById, getUserByEmail, createUser, deleteUser, updateUserPassword, updateUserDetails, setForcePasswordChange } from '@/db/user';
import { PREFERRED_LANGUAGE, PublicUser, PublicUserSelf, User, UserInTeam } from '@/types/user';
import { getTeamUsers, getTeamUser, getTeamUserRoles } from '@/db/team';
import { getPublicUserSelfById } from '@/utils/userHelper';
import { requireSignedIn, requireScope } from '@/middleware/auth';
import { inviteUserSchema } from '@/schemas/team';
import { AppError } from '@/middleware/errors';
import { hashInviteToken } from '@/utils/tokenHelper';
import { generateAccessToken } from '@/utils/tokenHelper';
import { inviteUserToTeamAndSendEmail, userCanBeInvited } from '@/utils/teamHelper';
import { createId } from '@/utils/userHelper';
import { hashPassword } from '@/utils/authHelper';
import { sendTeamAddedEmail } from '@/utils/emailHelper';

const router: Router = Router();

router.post('/', requireSignedIn, validate(createTeamSchema), async (req: Request, res: Response) => {
  const { name } = req.body;

  const newTeamId = createId();
  await createTeam({ id: newTeamId, name });
  const [ user ] = await getUserById(req.user?.sub!);
  const [ team ] = await getTeamById(newTeamId);

  if(!user) {
    return res.status(404).json({
      success: false,
      message: 'User not found',
      code: 'something_went_wrong'
    });
  }

  await createTeamUser(newTeamId, user.id);
  await createTeamUserRole(newTeamId, user.id, 'owner');

  const publicUser = await getPublicUserSelfById(req.user?.sub!, null);
  if(!publicUser) {
    throw new AppError('User not found', 404, 'something_went_wrong');
  }

  const accessToken = await generateAccessToken(publicUser)

  return res.status(201).json({
    success: true,
    message: 'Team created successfully',
    data: {
      user: publicUser,
      token: accessToken,
      team: {
        ...team,
        roles: [{
          role: 'owner',
          guardianOf: null
        }]
      }
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

  let publicUsers: UserInTeam[] = users.map((user) => {
    return {
      ...user,
      roles: roles.filter((role) => role.userId === user.userId),
    }
  });

  return res.status(200).json({
    success: true,
    message: 'Team users fetched successfully',
    code: 'team_users_fetched_successfully',
    data: publicUsers
  });
});

// Add a role for an existing team user
const addTeamUserRoleSchema = z.object({
  role: z.enum(['admin', 'coach', 'athlete', 'guardian'], { error: 'Role is required' }),
  guardianOf: z.string().optional()
}).refine((data) => (data.role === 'guardian' ? !!data.guardianOf : !data.guardianOf), {
  message: "If role is 'guardian', guardianOf is required; otherwise it must be omitted",
  path: ['guardianOf']
});

router.post('/:teamId/user/:userId/role',
  requireSignedIn,
  requireScope('membership:create', 'team'),
  validate(addTeamUserRoleSchema),
  async (req: Request, res: Response) => {
    const { teamId, userId } = req.params;
    const { role, guardianOf } = req.body as { role: 'admin' | 'coach' | 'athlete' | 'guardian'; guardianOf?: string };

    if (!teamId || !userId) {
      throw new AppError('Invalid parameters', 400, 'something_went_wrong');
    }

    // Team must exist
    const [team] = await getTeamById(teamId);
    if (!team) {
      throw new AppError('Team not found', 404, 'something_went_wrong');
    }

    // User must exist
    const [user] = await getUserById(userId) as User[];
    if (!user) {
      throw new AppError('User not found', 404, 'user_not_found');
    }

    // Ensure user is in team; if not, add them
    const [teamUser] = await getTeamUser(teamId, userId);
    if (!teamUser) {
      await createTeamUser(teamId, userId);
    }

    // Validate guardianOf target when role is guardian
    if (role === 'guardian') {
      if (guardianOf === userId) {
        throw new AppError('User cannot be guardian of themselves', 400, 'invalid_guardian_relationship');
      }
      const [ guarded ] = await getTeamUser(teamId, guardianOf!);
      if (!guarded) {
        throw new AppError('Guardian target not in team', 400, 'guardian_target_not_in_team');
      }
      const existingGuardianRoles = await getTeamUserRoles(teamId, userId);
      const hasGuardianForTarget = existingGuardianRoles.some(r => r.role === 'guardian' && r.guardianOf === guardianOf);
      if (hasGuardianForTarget) {
        throw new AppError('User already has guardian role for target', 400, 'user_already_in_team_with_role');
      }

      await createTeamUserRole(teamId, userId, 'guardian', guardianOf);
    } else {
      // Non-guardian roles must not duplicate
      const existingRoles = await getTeamUserRoles(teamId, userId);
      const hasRole = existingRoles.some(r => r.role === role && r.guardianOf == null);
      if (hasRole) {
        throw new AppError('User already has role in team', 400, 'user_already_in_team_with_role');
      }

      await createTeamUserRole(teamId, userId, role);
    }

    return res.status(201).json({
      success: true,
      message: 'Role added successfully',
      code: 'role_added_successfully'
    });
  }
);

router.post('/:teamId/invite', requireSignedIn, requireScope('membership:create', 'team'), validate(inviteUserSchema), async (req: Request, res: Response) => {
  const { teamId } = req.params;

  console.log('req.body', req.body);

  type guardianBody = {
    email: string,
    firstName?: string | undefined,
    lastName?: string | undefined,
    preferredLanguage: PREFERRED_LANGUAGE
  }

  let { email, role, guardianOf, guardians, firstName, lastName, preferredLanguage } = req.body as {
    email: string, role: NORMAL_ROLES, guardianOf: string, guardians: guardianBody[], firstName?: string, lastName?: string, preferredLanguage: PREFERRED_LANGUAGE
  };

  guardians = (guardians || []).map(g => ({ ...g, email: g.email.toLowerCase().trim(), firstName: g.firstName?.trim(), lastName: g.lastName?.trim() }));
  firstName = firstName?.trim();
  lastName = lastName?.trim();

  email = email.toLowerCase().trim();

  // BASIC VALIDATIONS
  if(!teamId) {
    throw new AppError('Invalid team ID', 400, 'something_went_wrong');
  }
  if(guardians && guardians.length > 0 && guardians.some(g => g.email === email)) {
    throw new AppError('Guardian cannot be the same as the user', 400, 'guardian_cannot_be_the_same_as_the_user');
  }
  const [ team ] = await getTeamById(teamId);
  if(!team) {
    throw new AppError('Team not found', 404, 'something_went_wrong');
  }
  const uniqueGuardians = new Set(guardians?.map(g => g.email) || []);
  if(uniqueGuardians.size !== (guardians || []).length) {
    throw new AppError('Guardian emails must be unique', 400, 'guardians_must_be_unique');
  }


  // VALIDATIONS FOR INVITED MAIN USER
  let invitedUserId: string | null = null;
  const mainInviteCheck = await userCanBeInvited(email, teamId, role, guardianOf);

  let mainUserExistedAlready = false
  if (role === 'guardian') {
    // For guardians: allow existing users without sending an invite.
    if (!mainInviteCheck.userToBeCreated) {
      mainUserExistedAlready = true;
      const existingGuardianId = mainInviteCheck.publicUser!.id;
      // Guardian cannot be the same person as the guardee
      if (guardianOf && existingGuardianId === guardianOf) {
        throw new AppError('User cannot be guardian of themselves', 400, 'invalid_guardian_relationship');
      }

      // Ensure membership exists; if not, add directly (no invite)
      const [existingMembership] = await getTeamUser(teamId, existingGuardianId);
      if (!existingMembership) {
        await createTeamUser(teamId, existingGuardianId, 'active');
      }

      // Prevent duplicate guardian relationship
      const existingRoles = await getTeamUserRoles(teamId, existingGuardianId);
      const hasGuardianForTarget = existingRoles.some(r => r.role === 'guardian' && r.guardianOf === guardianOf);
      if (hasGuardianForTarget) {
        throw new AppError('Guardian already invited to team', 400, 'guardian_already_invited_to_team_for_this_user');
      }

      await createTeamUserRole(teamId, existingGuardianId, 'guardian', guardianOf);
      invitedUserId = existingGuardianId; // For consistency, though guardians array handling is skipped when role === 'guardian'
      const [ existingGuardian ] = await getUserById(invitedUserId) as User[];
      if(!existingGuardian) {
        throw new AppError('User not found', 404, 'user_not_found');
      }
      await sendTeamAddedEmail(existingGuardian.email, team.name, 'guardian', existingGuardian.firstName, existingGuardian.preferredLanguage || preferredLanguage);
    } else {
      // New guardian user: create and invite
      invitedUserId = createId();
      await createUser({ id: invitedUserId, email, firstName, lastName, passwordHash: null, preferredLanguage, forcePasswordChange: true, emailConfirmed: true });
      await inviteUserToTeamAndSendEmail(invitedUserId, teamId, req.user?.sub!, 'guardian');
      await createTeamUserRole(teamId, invitedUserId, 'guardian', guardianOf);
    }
  } else {
    // Non-guardian flow: original behavior
    if(!mainInviteCheck.canBeInvited) {
      throw new AppError('User already invited to team', 400, 'user_already_invited_to_team');
    }
    if(mainInviteCheck.userToBeCreated) {
      invitedUserId = createId();
      await createUser({ id: invitedUserId, email, firstName, lastName, passwordHash: null, preferredLanguage, forcePasswordChange: true, emailConfirmed: true });
    } else {
      invitedUserId = mainInviteCheck.publicUser?.id!;
      mainUserExistedAlready = true;
    }
    if(mainInviteCheck.userTeamToBeCreated) {
      if(mainInviteCheck.userToBeCreated) {
        // New user - send invite
        await inviteUserToTeamAndSendEmail(invitedUserId, teamId, req.user?.sub!, role);
      } else {
        // Existing user - add directly with active status
        const [ existingUser ] = await getUserById(invitedUserId) as User[];
        if(!existingUser) {
          throw new AppError('User not found', 404, 'user_not_found');
        }
        await sendTeamAddedEmail(existingUser.email, team.name, role, existingUser.firstName, existingUser.preferredLanguage || preferredLanguage);
        await createTeamUser(teamId, invitedUserId, 'active');
        mainUserExistedAlready = true;
      }
    }
    await createTeamUserRole(teamId, invitedUserId, role, guardianOf);
  }

  // GUARDIANS CREATION (only when main invited user is NOT a guardian)
  if (role !== 'guardian') {
    for (const guardian of guardians || []) {
      console.log('guardian', guardian);

      // If a user with this email already exists, do not invite; add membership (if needed) and guardian role directly
      const [existingGuardian] = await getUserByEmail(guardian.email) as User[];
      if (existingGuardian) {
        if (existingGuardian.id === invitedUserId) {
          throw new AppError('User cannot be guardian of themselves', 400, 'invalid_guardian_relationship');
        }

        const [membership] = await getTeamUser(teamId, existingGuardian.id);
        if (!membership) {
          await createTeamUser(teamId, existingGuardian.id);
        }

        const existingRoles = await getTeamUserRoles(teamId, existingGuardian.id);
        const hasGuardianForTarget = existingRoles.some(r => r.role === 'guardian' && r.guardianOf === invitedUserId);
        if (hasGuardianForTarget) {
          throw new AppError('Guardian already invited to team', 400, 'guardian_already_invited_to_team_for_this_user');
        }

        await createTeamUserRole(teamId, existingGuardian.id, 'guardian', invitedUserId!);
        await sendTeamAddedEmail(email, team.name, 'guardian', firstName, existingGuardian.preferredLanguage || preferredLanguage);
        continue;
      }

      // Otherwise, create new user, invite to team, and add guardian role
      const guardianUserId = createId();
      await createUser({ id: guardianUserId, email: guardian.email, firstName: guardian.firstName, lastName: guardian.lastName, passwordHash: null, preferredLanguage: guardian.preferredLanguage, forcePasswordChange: true, emailConfirmed: true });
      await inviteUserToTeamAndSendEmail(guardianUserId, teamId, req.user?.sub!, 'guardian');
      await createTeamUserRole(teamId, guardianUserId, 'guardian', invitedUserId!);
    }
  }

  res.status(201).json({
    success: true,
    message: 'Invite created successfully',
    code: 'invite_created_successfully',
  });
});

// router.post('/join', async (req: Request, res: Response) => {
//   const { token } = req.body;

//   const tokenHash = hashInviteToken(token)
//   const [ invite ] = await getInviteByTokenHash(tokenHash);

//   if(!invite) {
//     throw new AppError('Invite not found', 404, 'invalid_invite');
//   }

//   if(invite.userId !== req.user?.sub) {
//     throw new AppError('User not authorized to join team', 403, 'invite_for_other_email_address');
//   }

//   if(invite.validUntil < new Date()) {
//     throw new AppError('Invite expired', 400, 'invalid_invite');
//   }

//   const [ teamUser ] = await getTeamUser(invite.teamId, invite.userId);

//   if(!teamUser) {
//     await createTeamUser(invite.teamId, invite.userId);
//   }

//   const [ teamUserRole ] = await getTeamUserRole(invite.teamId, invite.userId, invite.role, invite.guardianOf ?? undefined);
//   if(teamUserRole) {
//     throw new AppError('User already in team with role', 400, 'user_already_in_team_with_role');
//   }

//   await createTeamUserRole(invite.teamId, invite.userId, invite.role, 'active', invite.guardianOf ?? undefined);

//   await softDeleteInvite(invite.id!);

//   return res.status(200).json({
//     success: true,
//     message: 'User joined team successfully',
//     code: 'user_joined_team_successfully'
//   });
// });

router.delete('/:teamId/user/:userId/role/:role', requireSignedIn, requireScope('membership:delete', 'team'), async (req: Request, res: Response) => {
  const { teamId, userId, role } = req.params as { teamId: string, userId: string, role: ROLES };
  const { guardianOf } = req.query as { guardianOf?: string };

  if(!teamId || !userId || !role) {
    throw new AppError('Invalid parameters', 400, 'something_went_wrong');
  }
  if(role === 'guardian' && !guardianOf) {
    throw new AppError('Invalid parameters', 400, 'something_went_wrong');
  }
  // check role is in the array of roles
  if(!['admin', 'coach', 'athlete', 'guardian'].includes(role)) {
    throw new AppError('Invalid role', 400, 'invalid_role');
  }

  const [ user ] = await getUserById(userId) as User[];
  if(!user) {
    throw new AppError('User not found', 404, 'user_not_found');
  }

  await deleteTeamUserRole(teamId, userId, role, guardianOf);

  res.json({
    success: true,
    message: 'Role deleted successfully',
    code: 'role_deleted_successfully'
  });
});

router.delete('/:teamId/user/:userId', requireSignedIn, requireScope('membership:delete', 'team'), async (req: Request, res: Response) => {
  const { teamId, userId } = req.params;

  if(!teamId || !userId) {
    throw new AppError('Invalid parameters', 400, 'something_went_wrong');
  }

  const [ userTeam ] = await getTeamUser(teamId, userId);
  const [ user ] = await getUserById(userId) as User[];

  const willDeleteUser = !user?.passwordHash; // if user has no password, it means it's an invited user

  if(!userTeam) {
    throw new AppError('User not found', 404, 'user_not_found');
  }

  const teamUserRoles = await getTeamUserRoles(teamId, userId);
  if(teamUserRoles.some(r => r.role === 'owner')) {
    throw new AppError('Cannot delete owner role', 400, 'cannot_delete_owner_role');
  }

  const guardiansTeamUserRoles = await getTeamUserRolesForGuardian(teamId, userId);
  if(guardiansTeamUserRoles.length > 0) {
    throw new AppError('Cannot delete user if there are guardians', 400, 'cannot_delete_user_if_there_are_guardians');
  }

  await deleteTeamUserRolesForUser(teamId, userId);
  await deleteTeamUser(teamId, userId);
  if(willDeleteUser) {
    await deleteUser(userId);
  }

  res.json({
    success: true,
    message: 'User deleted successfully',
    code: 'user_deleted_successfully'
  });
});

const updateTeamUserRoleSchema = z.object({
  roles: z.array(z.object({
    role: z.enum(['admin', 'coach', 'athlete'], { error: 'Role is required' })
  })),
})

router.patch('/:teamId/user/:userId/role', requireSignedIn, requireScope('membership:create', 'team'), requireScope('membership:delete', 'team'), validate(updateTeamUserRoleSchema), async (req: Request, res: Response) => {
  const { teamId, userId } = req.params;
  const { roles } = req.body as { roles: { role: NORMAL_ROLES }[] };

  console.log('roles', roles);

  if(!teamId || !userId || !roles) {
    console.log('Invalid parameters');
    throw new AppError('Invalid parameters', 400, 'something_went_wrong');
  }

  const teamUserRoles = await getTeamUserRoles(teamId, userId);

  if(roles.length === 0 && !teamUserRoles.some(r => r.role === 'guardian') && !teamUserRoles.some(r => r.role === 'owner')) {
    throw new AppError('Invalid parameters', 400, 'no_roles_left_after_deletion');
  }

  const deleteRoles = teamUserRoles.filter(r => !roles.some(r2 => r2.role === r.role) && r.role !== 'owner' && r.role !== 'guardian');
  const createRoles = roles.filter(r => !teamUserRoles.some(r2 => r2.role === r.role));

  if(deleteRoles.some(r => r.role === 'athlete')) {
    const guardians = await getTeamUserRolesForGuardian(teamId, userId);

    if(guardians && guardians.length > 0) {
      throw new AppError('Cannot delete athlete role if there are guardians', 400, 'cannot_delete_athlete_role_if_there_are_guardians');
    }
  }

  for (const role of deleteRoles) {
    await deleteTeamUserRole(teamId, userId, role.role, role.guardianOf);
  }

  for (const role of createRoles) {
    await createTeamUserRole(teamId, userId, role.role);
  }

  res.json({
    success: true,
    message: 'Team user role updated successfully',
    code: 'team_user_role_updated_successfully'
  });
});

const updateTeamUserNameSchema = z.object({
  firstName: z.string().min(1).max(100).optional(),
  lastName: z.string().min(1).max(100).optional(),
});

router.patch('/:teamId/user/:userId/name', requireSignedIn, requireScope('user:update', 'team'), validate(updateTeamUserNameSchema), async (req: Request, res: Response) => {
  const { teamId, userId } = req.params;
  const { firstName, lastName } = req.body as { firstName?: string; lastName?: string };

  if (!teamId || !userId) {
    throw new AppError('Invalid parameters', 400, 'something_went_wrong');
  }

  if (!firstName && !lastName) {
    throw new AppError('At least one of firstName or lastName is required', 400, 'no_name_provided');
  }

  // Check if the target user is an athlete in this team
  const teamUserRoles = await getTeamUserRoles(teamId, userId);
  if (!teamUserRoles || !teamUserRoles.some(r => r.role === 'athlete')) {
    throw new AppError('User is not an athlete in this team', 403, 'user_not_athlete');
  }

  const updates: { firstName?: string; lastName?: string } = {};
  if (firstName !== undefined) updates.firstName = firstName;
  if (lastName !== undefined) updates.lastName = lastName;

  await updateUserDetails(updates, userId);

  res.json({
    success: true,
    message: 'User name updated successfully',
    code: 'user_name_updated_successfully'
  });
});

router.post('/join', async (req: Request, res: Response) => {
  const { token, password, repeatPassword, firstName, lastName, preferredLanguage } = req.body;

  if(!token) {
    throw new AppError('Token is required', 400, 'something_went_wrong');
  }

  const tokenHash = hashInviteToken(token as string);
  const [ invite ] = await getTeamUserByTokenHash(tokenHash);

  if(!invite) {
    throw new AppError('Invite not found', 404, 'invalid_invite');
  }

  const [ user ] = await getUserById(invite?.userId) as User[];
  if(!user) {
    throw new AppError('User not found', 404, 'user_not_found');
  }
  if((user.forcePasswordChange || !user.passwordHash) && (!password || password !== repeatPassword)) {
    throw new AppError('Password does not match', 400, 'password_does_not_match');
  }
  if(!user.firstName && !firstName) {
    throw new AppError('First name is required', 400, 'first_name_is_required');
  }
  if(!user.lastName && !lastName) {
    throw new AppError('Last name is required', 400, 'last_name_is_required');
  }
  if(user.forcePasswordChange || !user.passwordHash) {
    const passwordHash = await hashPassword(password);
    await updateUserPassword(user.id, passwordHash);
  }
  if(firstName || lastName || preferredLanguage) {
    await updateUserDetails({ firstName, lastName, preferredLanguage }, user.id);
  }

  await setUserTeamActive(invite.teamId, user.id);
  await setForcePasswordChange(user.id, false);

  res.json({
    success: true,
    message: 'Joined team successfully',
    code: 'joined_team'
  });
});

router.post('/get-join', async (req: Request, res: Response) => {
  const { token } = req.body;

  const tokenHash = hashInviteToken(token);
  const [ invite ] = await getTeamUserByTokenHash(tokenHash);

  console.log('token', token);
  console.log('tokenHash', tokenHash);
  console.log('invite', invite);

  if(!invite || !invite.userId) {
    throw new AppError('Invite not found', 404, 'invalid_invite');
  }

  const [ user ] = await getUserById(invite?.userId) as User[];

  if(invite.validUntil < new Date()) {
    throw new AppError('Invite expired', 400, 'invalid_invite');
  }

  res.json({
    success: true,
    message: 'Invite found',
    code: 'invite_found',
    data: {
      team_user: { ...invite, tokenHash: undefined },
      user: { ...user, passwordHash: undefined }
    }
  });
});

router.delete('/:teamId/self/:userId', requireSignedIn, requireScope('membership:delete', 'individual'), async (req: Request, res: Response) => {
  const { teamId, userId } = req.params;

  if(!teamId || !userId) {
    throw new AppError('Invalid parameters', 400, 'something_went_wrong');
  }

  const teamUserRoles = await getTeamUserRoles(teamId, userId);
  if(teamUserRoles.some(r => r.role === 'owner')) {
    throw new AppError('Cannot delete owner role', 400, 'cannot_delete_owner_role');
  }

  await deleteTeamUser(teamId, userId);

  res.json({
    success: true,
    message: 'Team user deleted successfully',
    code: 'team_user_deleted_successfully'
  });
});

router.put('/ownership', requireSignedIn, requireScope('ownership:transfer', 'team'), async (req: Request, res: Response) => {
  const { teamId, userId } = req.params;
  const { newOwnerId } = req.body;

  if(!teamId || !userId || !newOwnerId) {
    throw new AppError('Invalid parameters', 400, 'something_went_wrong');
  }
  const [ oldOwner ] = await getUserById(userId) as User[];
  if(!oldOwner) {
    throw new AppError('User not found', 404, 'user_not_found');
  }
  const [ newOwner ] = await getUserById(newOwnerId) as User[];
  if(!newOwner) {
    throw new AppError('User not found', 404, 'user_not_found');
  }
  if(!newOwner.passwordHash) {
    throw new AppError('User has no password', 400, 'new_owner_not_signed_up');
  }

  await createTeamUserRole(teamId, newOwnerId, 'owner');
  await deleteTeamUserRole(teamId, userId, 'owner');

  res.json({
    success: true,
    message: 'Ownership transferred successfully',
    code: 'ownership_transferred_successfully'
  });
});

export default router;