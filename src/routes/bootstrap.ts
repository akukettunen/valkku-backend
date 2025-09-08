import { Router, Request, Response } from 'express';
import { User, PublicUser } from '@/types/user';
import { requireAuth } from '@/middleware/auth';
import { getUserByAuth0Id, initializeUser } from '@/db/user';
import { getPublicUserByAuth0Id } from '@/utils/userHelper';

const router: Router = Router();

// PUT /bootstrap - Bootstrap endpoint that returns or creates and returns user
router.put('/', requireAuth, async (req: Request, res: Response) => {
  console.log('Bootstrap endpoint hit');
  try {

    // Get Auth0 user ID from middleware
    const auth0Id = req.auth0Id;

    if (!auth0Id) {
      return res.status(401).json({
        success: false,
        message: 'User ID not found in token'
      });
    }

    // Check if user exists
    const existingUsers = await getUserByAuth0Id(auth0Id) as User[];

    if (existingUsers.length > 0) {
      // User exists, return user data without password
      const user = await getPublicUserByAuth0Id(auth0Id) as PublicUser;

      return res.status(200).json({
        success: true,
        message: 'User found',
        data: user
      });
    } else {
      // User doesn't exist, create new user
      await initializeUser(auth0Id);

      // Fetch the created user to return complete data
      const user = await getPublicUserByAuth0Id(auth0Id) as PublicUser;

      return res.status(201).json({
        success: true,
        message: 'User created successfully',
        data: user
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

export default router;
