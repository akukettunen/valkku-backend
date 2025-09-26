import { Router, Request, Response } from 'express';
import { PREFERRED_LANGUAGE, PublicUser, User } from '@/types/user';
import { validate } from '@/middleware/validation';
import { patchUserSchema } from '@/schemas/user';
import { getUserById, updateUserDetails } from '@/db/user';
import { getPublicUserById } from '@/utils/userHelper';
import { AppError } from '@/middleware/errors';
import { requireSignedIn } from '@/middleware/auth';
import { generateAccessToken } from '@/utils/tokenHelper';

const router: Router = Router();

router.get('/me', requireSignedIn, async (req: Request, res: Response) => {
  console.log('🔍 [USER/ME] Request received');
  console.log('🔍 [USER/ME] Headers:', req.headers);
  console.log('🔍 [USER/ME] Cookies:', req.cookies);
  console.log('🔍 [USER/ME] User from req.user:', req.user);
  console.log('🔍 [USER/ME] User ID:', req.user?.sub);

  try {
    const publicUser = await getPublicUserById(req.user?.sub!, null) as PublicUser;
    console.log('🔍 [USER/ME] Public user found:', !!publicUser);

    if(!publicUser) {
      console.log('❌ [USER/ME] User not found in database');
      throw new AppError('User not found', 404, 'something_went_wrong');
    }

    console.log('🔍 [USER/ME] Generating new access token');
    const token = await generateAccessToken(publicUser);
    console.log('🔍 [USER/ME] Access token generated successfully');

    console.log('✅ [USER/ME] Success - returning user data');
    return res.status(200).json({
      success: true,
      message: 'User found',
      code: 'user_found',
      data: {
        user: publicUser,
        token: token
      }
    });
  } catch (error) {
    console.log('❌ [USER/ME] Error occurred:', error);
    throw error;
  }
});

router.patch('/me', requireSignedIn, validate(patchUserSchema), async (req: Request, res: Response) => {
  const { emojiClickedCount, firstName, lastName, preferredLanguage } = req.body;
  console.log('req.user', req.user);
  const [ user ] = await getUserById(req.user?.sub!) as User[];
  if (!user) {
    throw new AppError('User not found', 404, 'user_not_found');
  }

  const updates: { emojiClickedCount?: number; firstName?: string; lastName?: string; preferredLanguage?: PREFERRED_LANGUAGE } = {
    emojiClickedCount,
    firstName,
    lastName,
    preferredLanguage
  };

  await updateUserDetails(updates, user.id);

  const updatedUser = await getPublicUserById(req.user?.sub!, null) as PublicUser;

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