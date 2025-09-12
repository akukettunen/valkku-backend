import { Router, Request, Response } from 'express';
import { PublicUser, User } from '@/types/user';
import { validate } from '@/middleware/validation';
import { patchUserSchema } from '@/schemas/user';
import { getUserById, updateUserDetails } from '@/db/user';
import { getPublicUserById } from '@/utils/userHelper';
import { AppError } from '@/middleware/errors';
import { requireSignedIn } from '@/middleware/auth';

const router: Router = Router();

router.get('/me', requireSignedIn, async (req: Request, res: Response) => {
  const user = await getPublicUserById(req.user?.id!, null) as PublicUser;

  if(!user) throw new AppError('User not found', 404, 'something_went_wrong');

  return res.status(200).json({
    success: true,
    message: 'User found',
    code: 'user_found',
    data: user
  });
});

router.patch('/me', requireSignedIn, validate(patchUserSchema), async (req: Request, res: Response) => {
  const { emojiClickedCount, firstName, lastName } = req.body;
  console.log('req.user', req.user);
  const [ user ] = await getUserById(req.user?.id!) as User[];
  if (!user) {
    throw new AppError('User not found', 404, 'user_not_found');
  }

  const updates: { emojiClickedCount?: number; firstName?: string; lastName?: string; pendingDetails?: boolean } = {
    emojiClickedCount,
    firstName,
    lastName
  };

  if (firstName && lastName) {
    updates.pendingDetails = false;
  }

  await updateUserDetails(updates, user.id);

  const updatedUser = await getPublicUserById(req.user?.id!, null) as PublicUser;

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

export default router;