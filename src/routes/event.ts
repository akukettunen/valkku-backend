import { Router, Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { validate } from '@/middleware/validation';
import { requireSignedIn, requireScope, validateBasedOnScope, requireSuperAdmin } from '@/middleware/auth';
import { AppError } from '@/middleware/errors';
import { EVENT_PLAN_PART_SCOPE, EventPlanPartType, LocalizationObject, Event } from '@/types/event';
import { updateEventPlanPartType, deleteEventPlanPartType, getEventPlanPartTypes, getEventPlanPartTypeById, createEventPlanPartType, updateEventPlanPartTypePosition } from '@/db/event';
import { createEventPlanPartTypeSchema } from '@/schemas/event';
import { RowDataPacket } from 'mysql2';
import { OBJECT_SCOPE } from '@/types/general';
import { Transaction } from '@/db/index';

const router: Router = Router();

router.post('/team/:teamId', requireSignedIn, requireScope('event:create', 'team'), async (req: Request, res: Response) => {
  const { teamId } = req.params as { teamId: string };
  const tr = new Transaction();
  const {
    title,
    notes,
    type,
    ownNotes,
    coachesNotes,
    eventDate,
    startTimeUnixSec,
    endTimeUnixSec,
    locationId,
    repeats,
    repeatsOn,
    repeatsUntilUnixSec,
    status,
  } = req.body as Event;

  // tr.addTr(async () => {
  //   return await createEvent(req.body);
  // });

  const [ createResult ] = await tr.execute();

  res.status(201).json({
    success: true,
    message: 'Event created successfully',
    data: 'ok!'
  });
})

const updateEventPlanPartTypePositionsSchema = z.object({
  scope: z.enum([ 'global', 'club', 'team', 'user' ]),
  positions: z.array(z.object({
    id: z.number(),
    pos: z.number()
  }))
});
router.get('/plan-part-type/global', requireSignedIn, requireSuperAdmin, async (req: Request, res: Response, next: NextFunction) => {
  const eventPlanPartTypes = await getEventPlanPartTypes('global', null, null, true);

  res.status(200).json({
    success: true,
    message: 'Event plan part types fetched successfully',
    data: eventPlanPartTypes
  });
});

router.get('/plan-part-type/team/:teamId', requireSignedIn, async (req: Request, res: Response, next: NextFunction) => {
  const { teamId } = req.params as { teamId: string, userId: string };
  const globalTypes = await getEventPlanPartTypes('global', null, null, false);
  const teamTypes = await getEventPlanPartTypes('team', teamId, null, false);
  const userTypes = await getEventPlanPartTypes('user', null, req.user?.sub!, false);
  const eventPlanPartTypes = [ ...globalTypes, ...teamTypes, ...userTypes ]

  res.status(200).json({
    success: true,
    message: 'Event plan part types fetched successfully',
    data: eventPlanPartTypes
  });
});

router.put('/plan-part-type/:id', requireSignedIn, validateBasedOnScope('plan-part-type:update'), async (req: Request, res: Response, next: NextFunction) => {
  const { id } = req.params as { id: string };
  const { titleObject, color, scope, archived, teamId, userId } = req.body as { titleObject: LocalizationObject, color: string, scope: EVENT_PLAN_PART_SCOPE, teamId: string, userId: string, archived: boolean };
  console.log(req.body)
  const eventPlanPartType = await updateEventPlanPartType(id, titleObject, color, scope, archived, teamId || null, userId || null);
  res.status(200).json({
    success: true,
    message: 'Event plan part type updated successfully',
    data: eventPlanPartType
  });
});

router.delete('/plan-part-type/:id', requireSignedIn, async (req: Request, res: Response, next: NextFunction) => {
  const { id } = req.params as { id: string };

  const [ eventPlanPartType ] = await getEventPlanPartTypeById(id) as EventPlanPartType[];

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

  await deleteEventPlanPartType(id);

  res.status(200).json(eventPlanPartType);
});

router.post('/plan-part-type', requireSignedIn, validateBasedOnScope('plan-part-type:create'), validate(createEventPlanPartTypeSchema), async (req: Request, res: Response, next: NextFunction) => {
  const { titleObject, color, scope, teamId, userId, position } = req.body as { titleObject: LocalizationObject, color: string, clubId: string, scope: EVENT_PLAN_PART_SCOPE, teamId: string, userId: string, position: number };

  const { insertId: id } = await createEventPlanPartType(titleObject, color, scope, req.user?.sub!, position, teamId || null, userId || null) as RowDataPacket;
  const [ eventPlanPartType ] = await getEventPlanPartTypeById(id) as EventPlanPartType[];

  res.status(201).json({
    success: true,
    message: 'Event plan part type created successfully',
    data: eventPlanPartType
  });
});

router.patch('/plan-part-type/positions', requireSignedIn, validate(updateEventPlanPartTypePositionsSchema), validateBasedOnScope('plan-part-type:update'), async (req: Request, res: Response, next: NextFunction) => {
  const { positions, scope } = req.body as { positions: { id: number, pos: number }[], scope: OBJECT_SCOPE };

  // Update positions in database
  for (const { id, pos } of positions) {
    await updateEventPlanPartTypePosition(id.toString(), pos, scope);
  }

  res.status(200).json({
    success: true,
    message: 'Event plan part type positions updated successfully'
  });
});

export default router;