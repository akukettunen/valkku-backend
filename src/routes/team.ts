import { Router, Request, Response } from 'express';
import { requireAuth } from '@/middleware/auth';
import { validate } from '@/middleware/validation';
import { createTeamSchema } from '@/schemas/team';
import { createTeam, createTeamUser } from '@/db/team';
import { getUserByAuth0Id } from '@/db/user';
import { User } from '@/types/user';
import { getPublicUserByAuth0Id } from '@/utils/userHelper';
import { authorize } from '@/middleware/auth';
const router: Router = Router();

router.post('/', requireAuth, validate(createTeamSchema), async (req: Request, res: Response) => {
  const { name } = req.body;

  const { insertId: createdTeamId } = await createTeam(name);
  const [ user ] = await getUserByAuth0Id(req.auth0Id!) as User[];

  if(!user) {
    return res.status(404).json({
      success: false,
      message: 'User not found'
    });
  }

  await createTeamUser(createdTeamId, user.id, 'owner');

  const publicUser = await getPublicUserByAuth0Id(req.auth0Id!);

  return res.status(201).json({
    success: true,
    message: 'Team created successfully',
    data: {
      user: publicUser
    }
  });
});

router.get('/:teamId/users', requireAuth, authorize('team-users:read', 'team'), async (req: Request, res: Response) => {
  return res.status(200).json({
    success: true,
    message: 'Team users fetched successfully',
    data: ['users here']
  });
});

export default router;
