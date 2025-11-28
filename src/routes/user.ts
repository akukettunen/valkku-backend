import { Router, Request, Response } from 'express';
import { PREFERRED_LANGUAGE, PublicUser, User } from '@/types/user';
import { validate } from '@/middleware/validation';
import { patchUserSchema } from '@/schemas/user';
import { getUserById, updateUserDetails } from '@/db/user';
import { getPublicUserSelfById, getPublicUserSelfByIdSimple } from '@/utils/userHelper';
import { AppError } from '@/middleware/errors';
import { requireSignedIn, requireScope } from '@/middleware/auth';
import { generateAccessToken } from '@/utils/tokenHelper';
import { query } from '@/db/index';

const router: Router = Router();

router.get('/me', requireSignedIn, async (req: Request, res: Response) => {
  const publicUser = await getPublicUserSelfById(req.user?.sub!, null);

  if(!publicUser) {
    throw new AppError('User not found', 404, 'something_went_wrong');
  }

  const token = await generateAccessToken(publicUser);

  return res.status(200).json({
    success: true,
    message: 'User found',
    code: 'user_found',
    data: {
      user: publicUser,
      token: token
    }
  });
});

router.patch('/me', requireSignedIn, validate(patchUserSchema), async (req: Request, res: Response) => {
  const { emojiClickedCount, firstName, lastName, preferredLanguage, notificationToken } = req.body;
  const [ user ] = await getUserById(req.user?.sub!) as User[];
  if (!user) {
    throw new AppError('User not found', 404, 'user_not_found');
  }

  const updates: { emojiClickedCount?: number; firstName?: string; lastName?: string; preferredLanguage?: PREFERRED_LANGUAGE; notificationToken?: string | null } = {
    emojiClickedCount,
    firstName,
    lastName,
    preferredLanguage,
    notificationToken
  };

  await updateUserDetails(updates, user.id);

  const updatedUser = await getPublicUserSelfById(req.user?.sub!, null);

  if (!updatedUser) {
    throw new AppError('Updated user not found', 404, 'user_not_found');
  }

  return res.status(200).json({
    success: true,
    message: 'User updated successfully',
    code: 'user_updated_successfully',
    data: updatedUser
  });
});

router.get(`/:userId`, requireSignedIn, requireScope('user:read', 'individual'), async (req: Request, res: Response) => {
  const { userId } = req.params as { userId: string };

  const user = await getPublicUserSelfByIdSimple(userId) as PublicUser;
  console.log('user', user);
  if(!user) {
    throw new AppError('User not found', 404, 'user_not_found');
  }

  return res.status(200).json({
    success: true,
    message: 'User found',
    data: [ user ]
  });
})

router.get(`/team/:teamId/athlete`, requireSignedIn, requireScope('user:read', 'team'), async (req: Request, res: Response) => {
  const { teamId } = req.params as { teamId: string };

  const users = await query(`
    SELECT
      users.fullName,
      users.firstName,
      users.lastName,
      users.email,
      users.id,
      users.profilePictureUrl,
      users.preferredLanguage
    FROM users
    LEFT JOIN team_users ON users.id = team_users.userId
    RIGHT JOIN team_user_roles ON users.id = team_user_roles.userId
    WHERE team_users.teamId = ? AND team_user_roles.role = 'athlete'
  `, [teamId]);

  return res.status(200).json({
    success: true,
    message: 'Users found',
    data: users
  });
});

export default router;