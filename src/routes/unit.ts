import { Router, Request, Response } from 'express';
import { models } from '@/db/index';
import { requireSignedIn } from '@/middleware/auth';

const router: Router = Router();

router.get('/', requireSignedIn, async (req: Request, res: Response) => {
  const units = await models.units.findAll({
      include: [{
          model: models.unitGroups,
          as: 'unitGroup'
      }]
  });

  return res.status(200).json({
    success: true,
    message: 'Units found',
    data: units
  });
});

export default router;
