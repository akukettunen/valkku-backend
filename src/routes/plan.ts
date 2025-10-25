import { Router, Request, Response, NextFunction } from 'express';
import { AppError } from '@/middleware/errors';
import { z } from 'zod';
import { validate } from '@/middleware/validation';
import { requireSignedIn, validateBasedOnScope, requireSuperAdmin } from '@/middleware/auth';
import { createEventPlanPartTypeSchema } from '@/schemas/event';
import { OBJECT_SCOPE } from '@/types/general';
import { EVENT_PLAN_PART_SCOPE, PlanPartType, LocalizationObject, Plan, PlanPartItem, PlanPart } from '@/types/event';
import { RowDataPacket } from 'mysql2';
import { updatePlanPartType, deletePlanPartType, getPlanPartTypes, getPlanPartTypeById, createPlanPartType, updatePlanPartTypePosition } from '@/db/event';
import { createPlanSchema } from '@/schemas/plan';
import { Transaction } from '@/db/index';
import { getPlanById, getPlanByEventId } from '@/utils/planHelper';
import { requireScope } from '@/middleware/auth';

const router: Router = Router();

const updateEventPlanPartTypePositionsSchema = z.object({
  scope: z.enum([ 'global', 'club', 'team', 'user' ]),
  positions: z.array(z.object({
    id: z.number(),
    pos: z.number()
  }))
});

router.post('/', requireSignedIn, validate(createPlanSchema), validateBasedOnScope('plan:post'), async (req: Request, res: Response) => {
  const {
    title,
    description,
    teamId,
    copyOfPlanId,
    eventId,
    scope,
    parts,
    items
  } = req.body as Plan & { parts: PlanPart[], items: PlanPartItem[] };

  const tr = new Transaction();
  var planId: number;

  console.log('req.body', req.body);

  tr.addTr(async (trx) => {
    return await trx.query(`
      DELETE FROM plans WHERE eventId = ? AND teamId = ?
    `, [eventId, teamId]);
  });

  // CREATE PLAN
  tr.addTr(async (trx) => {
    const res = await trx.query(
      `INSERT INTO plans (title, description, teamId, copyOfPlanId, eventId, scope)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [title ?? null, description ?? null, teamId, copyOfPlanId ?? null, eventId ?? null, scope]
    );
    planId = res.insertId;
    console.log('PLAN ID HERE!', planId);
    return res;
  });

  // CREATE PLAN PARTS
  tr.addTr(async (trx) => {
    if (!parts?.length) return;
    for (const part of parts) {
      await trx.query(
        `INSERT INTO plan_parts (id, planId, typeId, durationInMinutes, position) VALUES (?, ?, ?, ?, ?)`,
        [part.id, planId, part.typeId, part.durationInMinutes ?? null, part.position]
      );
    }
  });

  // ADD PLAN ITEMS
  tr.addTr(async (trx) => {
    if (!items?.length) return;
    for (const item of items) {
      console.log('ITEM', item);
      await trx.query(
        `INSERT INTO plan_part_items (id, planId, partId, type, position) VALUES (?, ?, ?, ?, ?)`,
        [item.id, item.partId ? null : planId, item.partId ?? null, item.type, item.position]
      );

      if(item.type === 'text') {
        await trx.query(
          `INSERT INTO plan_part_item_texts (planPartItemId, text) VALUES (?, ?)`,
          [item.id, item.item?.text ?? null]
        );
      }
    }
  });

  const [ deleteData, insertData ] = await tr.execute();

  const plan = await getPlanById(insertData.insertId);

  console.log('PLAN', plan);

  res.status(201).json({
    success: true,
    message: 'Plan created successfully',
    data: plan
  });
});

router.get('/event/:eventId/team/:teamId', requireSignedIn, requireScope('plan:read', 'team'), async (req: Request, res: Response, next: NextFunction) => {
  const { eventId, teamId } = req.params as { eventId: string, teamId: string };
  const eventIdNumber = parseInt(eventId);
  const plan = await getPlanByEventId(eventIdNumber, teamId);

  res.status(200).json({
    success: true,
    message: 'Plan fetched successfully',
    data: plan
  });
});

router.get('/plan-part-type/global', requireSignedIn, requireSuperAdmin, async (req: Request, res: Response, next: NextFunction) => {
  const eventPlanPartTypes = await getPlanPartTypes('global', null, null, true);

  res.status(200).json({
    success: true,
    message: 'Event plan part types fetched successfully',
    data: eventPlanPartTypes
  });
});

router.get('/plan-part-type/all/:teamId', requireSignedIn, async (req: Request, res: Response, next: NextFunction) => {
  const { teamId } = req.params as { teamId: string, userId: string };
  const globalTypes = await getPlanPartTypes('global', null, null, false);
  const teamTypes = await getPlanPartTypes('team', teamId, null, false);
  const userTypes = await getPlanPartTypes('user', null, req.user?.sub!, false);
  const eventPlanPartTypes = [ ...globalTypes, ...teamTypes, ...userTypes ]

  res.status(200).json({
    success: true,
    message: 'Event plan part types fetched successfully',
    data: eventPlanPartTypes
  });
});

router.get('/plan-part-type/team/:teamId', requireSignedIn, async (req: Request, res: Response, next: NextFunction) => {
  const { teamId } = req.params as { teamId: string };
  const eventPlanPartTypes = await getPlanPartTypes('team', teamId, null, false);
  res.status(200).json({
    success: true,
    message: 'Event plan part types fetched successfully',
    data: eventPlanPartTypes
  });
});

router.get('/plan-part-type/me', requireSignedIn, async (req: Request, res: Response, next: NextFunction) => {
  const includeArchived: boolean = req.query['includeArchived'] === 'true' ? true : false;

  const eventPlanPartTypes = await getPlanPartTypes('user', null, req.user?.sub!, includeArchived);
  res.status(200).json({
    success: true,
    message: 'Event plan part types fetched successfully',
    data: eventPlanPartTypes
  });
});

router.put('/plan-part-type/:id', requireSignedIn, validateBasedOnScope('plan-part-type:update'), async (req: Request, res: Response, next: NextFunction) => {
  const { id } = req.params as { id: string };
  let { titleObject, color, scope, archived, teamId, userId } = req.body as { titleObject: LocalizationObject, color: string, scope: EVENT_PLAN_PART_SCOPE, teamId: string | null | undefined, userId: string | null | undefined, archived: boolean };

  if(scope === 'team') {
    userId = null;
  } else if(scope === 'user') {
    teamId = null;
  }

  await updatePlanPartType(id, titleObject, color, scope, archived, teamId || null, userId || null);
  const [ eventPlanPartType ] = await getPlanPartTypeById(id) as PlanPartType[];
  console.log('eventPlanPartType', eventPlanPartType);
  res.status(200).json({
    success: true,
    message: 'Event plan part type updated successfully',
    data: eventPlanPartType
  });
});

router.delete('/plan-part-type/:id', requireSignedIn, async (req: Request, res: Response, next: NextFunction) => {
  const { id } = req.params as { id: string };

  const [ eventPlanPartType ] = await getPlanPartTypeById(id) as PlanPartType[];

  if(!eventPlanPartType) {
    throw new AppError('Event plan part type not found', 404, 'event_plan_part_type_not_found');
  }

  switch(eventPlanPartType.scope) {
    case 'global':
      if(!req.user?.superAdmin) {
        throw new AppError('User not authorized to delete event plan part type', 403, 'not_authorized');
      }
      break;
    case 'team':
      if(!req.user?.teams.some(team => team.teamId === eventPlanPartType.teamId)) {
        throw new AppError('User not authorized to delete event plan part type', 403, 'not_authorized');
      }
      break;
    case 'user':
      if(eventPlanPartType.userId !== req.user?.sub) {
        throw new AppError('User not authorized to delete event plan part type', 403, 'not_authorized');
      }
      break;
    case 'club':
      throw new AppError('Club scope is not supported yet', 403, 'unauthorized');
  }

  await deletePlanPartType(id);

  res.status(200).json(eventPlanPartType);
});

router.post('/plan-part-type/:teamId', requireSignedIn, validateBasedOnScope('plan-part-type:create'), validate(createEventPlanPartTypeSchema), async (req: Request, res: Response, next: NextFunction) => {
  const { titleObject, color, scope, teamId, userId } = req.body as { titleObject: LocalizationObject, color: string, clubId: string, scope: EVENT_PLAN_PART_SCOPE, teamId: string, userId: string, position: number };

  const planPartTypes = await getPlanPartTypes(scope, teamId, userId, false);

  const { insertId: id } = await createPlanPartType(titleObject, color, scope, req.user?.sub!, planPartTypes.length + 1, teamId || null, userId || null) as RowDataPacket;
  const [ eventPlanPartType ] = await getPlanPartTypeById(id) as PlanPartType[];

  res.status(201).json({
    success: true,
    message: 'Event plan part type created successfully',
    data: eventPlanPartType
  });
});

router.patch('/plan-part-type/positions/:teamId', requireSignedIn, validate(updateEventPlanPartTypePositionsSchema), validateBasedOnScope('plan-part-type:update'), async (req: Request, res: Response, next: NextFunction) => {
  const { positions, scope } = req.body as { positions: { id: number, pos: number }[], scope: OBJECT_SCOPE };

  for (const { id, pos } of positions) {
    await updatePlanPartTypePosition(id.toString(), pos, scope);
  }

  res.status(200).json({
    success: true,
    message: 'Event plan part type positions updated successfully'
  });
});

export default router;