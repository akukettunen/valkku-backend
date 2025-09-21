import { Router, Request, Response } from 'express';
import { z } from 'zod';
import { validate } from '@/middleware/validation';
import { createTeamSchema, NORMAL_ROLES } from '@/schemas/team';
import { createTeam, createTeamUser, createTeamUserRole, getTeamById, getTeamTeamUserRoles } from '@/db/team';
import { getUserById, getUserByEmail, createUser } from '@/db/user';
import { PREFERRED_LANGUAGE, PublicUser, User, UserInTeam } from '@/types/user';
import { getTeamUsers, getTeamUser, getTeamUserRole } from '@/db/team';
import { getPublicUserById } from '@/utils/userHelper';
import { requireSignedIn, requireScope } from '@/middleware/auth';
import { inviteUserSchema } from '@/schemas/team';
import { AppError } from '@/middleware/errors';
import { hashInviteToken } from '@/utils/tokenHelper';
import { generateAccessToken } from '@/utils/tokenHelper';
import { inviteUserToTeam, userCanBeInvited } from '@/utils/teamHelper';
import { createId } from '@/utils/userHelper';
import { TeamUserRole } from '@/types/team';

const router: Router = Router();

router.post('/', requireSignedIn, validate(createTeamSchema), async (req: Request, res: Response) => {
  const { name } = req.body;

  const newTeamId = createId();
  await createTeam({ id: newTeamId, name });
  const [ user ] = await getUserById(req.user?.sub!) as User[];
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

  const publicUser = await getPublicUserById(req.user?.sub!, null) as PublicUser;
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

router.post(
  '/:teamId/user/:userId/role',
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
      const existingGuardianRoles = await getTeamUserRole(teamId, userId);
      const hasGuardianForTarget = existingGuardianRoles.some(r => r.role === 'guardian' && r.guardianOf === guardianOf);
      if (hasGuardianForTarget) {
        throw new AppError('User already has guardian role for target', 400, 'user_already_in_team_with_role');
      }

      await createTeamUserRole(teamId, userId, 'guardian', guardianOf);
    } else {
      // Non-guardian roles must not duplicate
      const existingRoles = await getTeamUserRole(teamId, userId);
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

  if (role === 'guardian') {
    // For guardians: allow existing users without sending an invite.
    if (!mainInviteCheck.userToBeCreated) {
      const existingGuardianId = mainInviteCheck.publicUser!.id;
      // Guardian cannot be the same person as the guardee
      if (guardianOf && existingGuardianId === guardianOf) {
        throw new AppError('User cannot be guardian of themselves', 400, 'invalid_guardian_relationship');
      }

      // Ensure membership exists; if not, add directly (no invite)
      const [existingMembership] = await getTeamUser(teamId, existingGuardianId);
      if (!existingMembership) {
        await createTeamUser(teamId, existingGuardianId);
      }

      // Prevent duplicate guardian relationship
      const existingRoles = await getTeamUserRole(teamId, existingGuardianId);
      const hasGuardianForTarget = existingRoles.some(r => r.role === 'guardian' && r.guardianOf === guardianOf);
      if (hasGuardianForTarget) {
        throw new AppError('Guardian already invited to team', 400, 'guardian_already_invited_to_team_for_this_user');
      }

      await createTeamUserRole(teamId, existingGuardianId, 'guardian', guardianOf);
      invitedUserId = existingGuardianId; // For consistency, though guardians array handling is skipped when role === 'guardian'
    } else {
      // New guardian user: create and invite
      invitedUserId = createId();
      await createUser({ id: invitedUserId, email, firstName, lastName, passwordHash: null, preferredLanguage, forcePasswordChange: true });
      await inviteUserToTeam(invitedUserId, teamId, req.user?.sub!);
      await createTeamUserRole(teamId, invitedUserId, 'guardian', guardianOf);
    }
  } else {
    // Non-guardian flow: original behavior
    if(!mainInviteCheck.canBeInvited) {
      throw new AppError('User already invited to team', 400, 'user_already_invited_to_team_with_role');
    }
    if(mainInviteCheck.userToBeCreated) {
      invitedUserId = createId();
      await createUser({ id: invitedUserId, email, firstName, lastName, passwordHash: null, preferredLanguage, forcePasswordChange: true });
    } else {
      invitedUserId = mainInviteCheck.publicUser?.id!;
    }
    if(mainInviteCheck.userTeamToBeCreated) {
      await inviteUserToTeam(invitedUserId, teamId, req.user?.sub!);
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

        const existingRoles = await getTeamUserRole(teamId, existingGuardian.id);
        const hasGuardianForTarget = existingRoles.some(r => r.role === 'guardian' && r.guardianOf === invitedUserId);
        if (hasGuardianForTarget) {
          throw new AppError('Guardian already invited to team', 400, 'guardian_already_invited_to_team_for_this_user');
        }

        await createTeamUserRole(teamId, existingGuardian.id, 'guardian', invitedUserId!);
        continue;
      }

      // Otherwise, create new user, invite to team, and add guardian role
      const guardianUserId = createId();
      await createUser({ id: guardianUserId, email: guardian.email, firstName: guardian.firstName, lastName: guardian.lastName, passwordHash: null, preferredLanguage: guardian.preferredLanguage, forcePasswordChange: true });
      await inviteUserToTeam(guardianUserId, teamId, req.user?.sub!);
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