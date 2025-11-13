import { Router, Request, Response } from 'express';
import { validate } from '@/middleware/validation';
import { requireSignedIn, requireScope } from '@/middleware/auth';
import { AppError } from '@/middleware/errors';
import { models } from '@/db/index';
import { createPeriodSchema, updatePeriodSchema } from '@/schemas/period';

const router: Router = Router();

// GET /api/period/team/:teamId - Get all periods for a team
router.get('/team/:teamId', requireSignedIn, requireScope('period:read', 'team'), async (req: Request, res: Response) => {
  const { teamId } = req.params as { teamId: string };

  const periods = await models.periods.findAll({
    where: { teamId },
    include: [
      {
        model: models.users,
        as: 'createdBy',
        attributes: ['id', 'firstName', 'lastName']
      }
    ],
    order: [['startDate', 'DESC']]
  });

  res.json({
    success: true,
    data: periods
  });
});

// GET /api/period/:periodId/team/:teamId - Get a specific period
router.get('/:periodId/team/:teamId', requireSignedIn, requireScope('period:read', 'team'), async (req: Request, res: Response) => {
  const { periodId, teamId } = req.params as { periodId: string; teamId: string };

  const period = await models.periods.findOne({
    where: {
      id: periodId,
      teamId
    },
    include: [
      {
        model: models.users,
        as: 'createdBy',
        attributes: ['id', 'firstName', 'lastName']
      }
    ]
  });

  if (!period) {
    throw new AppError('Period not found', 404, 'period_not_found');
  }

  res.json({
    success: true,
    data: period
  });
});

// POST /api/period/team/:teamId - Create a new period
router.post('/team/:teamId', requireSignedIn, validate(createPeriodSchema), requireScope('period:create', 'team'), async (req: Request, res: Response) => {
  const { teamId } = req.params as { teamId: string };
  const { name, description, startDate, endDate, color } = req.body;
  const createdById = req.user?.sub!;

  const period = await models.periods.create({
    name,
    decsription: description || null,
    startDate,
    endDate,
    color: color || '#3B82F6',
    createdById,
    teamId,
    createdAt: new Date(),
    updatedAt: new Date()
  });

  const createdPeriod = await models.periods.findByPk(period.id, {
    include: [
      {
        model: models.users,
        as: 'createdBy',
        attributes: ['id', 'firstName', 'lastName']
      }
    ]
  });

  res.status(201).json({
    success: true,
    message: 'Period created successfully',
    data: createdPeriod
  });
});

// PUT /api/period/:periodId/team/:teamId - Update a period
router.put('/:periodId/team/:teamId', requireSignedIn, validate(updatePeriodSchema), requireScope('period:update', 'team'), async (req: Request, res: Response) => {
  const { periodId, teamId } = req.params as { periodId: string; teamId: string };
  const updates = req.body;

  // Check if period exists and belongs to this team
  const period = await models.periods.findOne({
    where: {
      id: periodId,
      teamId
    }
  });

  if (!period) {
    throw new AppError('Period not found', 404, 'period_not_found');
  }

  // Build update object
  const updateData: any = { updatedAt: new Date() };

  if (updates.name !== undefined) {
    updateData.name = updates.name;
  }
  if (updates.description !== undefined) {
    updateData.decsription = updates.description;
  }
  if (updates.startDate !== undefined) {
    updateData.startDate = updates.startDate;
  }
  if (updates.endDate !== undefined) {
    updateData.endDate = updates.endDate;
  }
  if (updates.color !== undefined) {
    updateData.color = updates.color;
  }

  // Check if there are actual changes
  if (Object.keys(updateData).length === 1) { // Only updatedAt
    const periodWithUser = await models.periods.findByPk(period.id, {
      include: [
        {
          model: models.users,
          as: 'createdBy',
          attributes: ['id', 'firstName', 'lastName']
        }
      ]
    });

    res.json({
      success: true,
      message: 'No changes to update',
      data: periodWithUser
    });
    return;
  }

  await period.update(updateData);
  await period.reload({
    include: [
      {
        model: models.users,
        as: 'createdBy',
        attributes: ['id', 'firstName', 'lastName']
      }
    ]
  });

  res.json({
    success: true,
    message: 'Period updated successfully',
    data: period
  });
});

// DELETE /api/period/:periodId/team/:teamId - Delete a period
router.delete('/:periodId/team/:teamId', requireSignedIn, requireScope('period:delete', 'team'), async (req: Request, res: Response) => {
  const { periodId, teamId } = req.params as { periodId: string; teamId: string };

  // Check if period exists and belongs to this team
  const period = await models.periods.findOne({
    where: {
      id: periodId,
      teamId
    }
  });

  if (!period) {
    throw new AppError('Period not found', 404, 'period_not_found');
  }

  await period.destroy();

  res.json({
    success: true,
    message: 'Period deleted successfully'
  });
});

export default router;
