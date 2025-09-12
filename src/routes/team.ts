import { Router, Request, Response } from 'express';
import { validate } from '@/middleware/validation';
import { createTeamSchema } from '@/schemas/team';
import { createTeam, createTeamUser, getTeamById } from '@/db/team';
import { getUserById } from '@/db/user';
import { PublicUser, User } from '@/types/user';
import { getTeamUsers } from '@/db/team';
import { getPublicUserById } from '@/utils/userHelper';
import { requireSignedIn } from '@/middleware/auth';
import { Team } from '@/types/team';
const router: Router = Router();

router.post('/', requireSignedIn, validate(createTeamSchema), async (req: Request, res: Response) => {
  const { name } = req.body;

  const { insertId: createdTeamId } = await createTeam(name);
  const [ user ] = await getUserById(req.user?.id!) as User[];
  const [ team ] = await getTeamById(createdTeamId);

  if(!user) {
    return res.status(404).json({
      success: false,
      message: 'User not found',
      code: 'something_went_wrong'
    });
  }

  await createTeamUser(createdTeamId, user.id, 'owner');

  const publicUser = await getPublicUserById(req.user?.id!, null) as PublicUser;

  return res.status(201).json({
    success: true,
    message: 'Team created successfully',
    data: {
      user: publicUser,
      team
    }
  });
});

router.get('/:teamId/users', requireSignedIn, async (req: Request, res: Response) => {
  if(!req.params['teamId']) {
    return res.status(400).json({
      success: false,
      message: 'Team ID is required',
      code: 'something_went_wrong'
    });
  }

  const users = await getTeamUsers(parseInt(req.params['teamId']));

  return res.status(200).json({
    success: true,
    message: 'Team users fetched successfully',
    code: 'team_users_fetched_successfully',
    data: users
  });
});

export default router;
