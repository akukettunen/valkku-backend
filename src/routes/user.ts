import { Router, Request, Response } from 'express';
import { User } from '@/types/user';
import { bootstrapUserSchema } from '@/schemas/auth';
import { validate } from '@/middleware/validation';
import { patchUserSchema } from '@/schemas/user';
import { requireAuth } from '@/middleware/auth';
import { getUserByAuth0Id, initializeUser, updateUserDetails } from '@/db/user';

const router: Router = Router();

router.get('/', requireAuth, async (req: Request, res: Response) => {
  try {
    // Get Auth0 user ID from middleware
    const auth0Id = req.auth0Id!;

    // Check if user exists
    const [ user] = await getUserByAuth0Id(auth0Id) as User[];

    if (user) {
      // User exists, return user data without password
      return res.status(200).json({
        success: true,
        message: 'User found',
        data: user
      });
    } else {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }
  } catch (error) {
    console.error('Bootstrap error:', error);
    return res.status(500).json({
      success: false,
      message: 'Internal server error in bootstrap handler'
    });
  }
});

router.patch('/', requireAuth, validate(patchUserSchema), async (req: Request, res: Response) => {
  const { emojiClickedCount, firstName, lastName } = req.body;

  try {
    const [ user ] = await getUserByAuth0Id(req.auth0Id!) as User[];
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Auto-set pendingDetails to false if firstName and lastName are provided
    const updates: { emojiClickedCount?: number; firstName?: string; lastName?: string; pendingDetails?: boolean } = {
      emojiClickedCount,
      firstName,
      lastName
    };

    if (firstName && lastName) {
      updates.pendingDetails = false;
    }

    await updateUserDetails(updates, user.id);

    // Fetch updated user data
    const [ updatedUser ] = await getUserByAuth0Id(req.auth0Id!) as User[];

    return res.status(200).json({
      success: true,
      message: 'User updated successfully',
      data: updatedUser
    });
  } catch (error) {
    console.error('Patch error:', error);
    return res.status(500).json({
      success: false,
      message: 'Internal server error in patch /user'
    });
  }
});

export default router;