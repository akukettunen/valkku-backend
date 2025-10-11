import { Router, Request, Response, NextFunction } from 'express';
import { validate } from '@/middleware/validation';
import { requireSignedIn, requireScope } from '@/middleware/auth';
import { getEventsByTeamIdRange, getEventsByTeamIdDate } from '@/db/event';
import { Transaction } from '@/db/index';
import { createEvent, getEventById } from '@/db/event';
import { createEventSchema } from '@/schemas/event';
import { AppError } from '@/middleware/errors';
import { query } from '@/db/index';
import { Event, Plan, PublicEvent } from '@/types/event';
import { Location } from './location';
import { hasRoleInTeam } from '@/utils/authHelper';
import { getPlanByEventId } from '@/utils/planHelper';

const router: Router = Router();

// Only for teams events
router.post('/team/:teamId', requireSignedIn, validate(createEventSchema), requireScope('event:create', 'team'), async (req: Request, res: Response) => {
  const { teamId } = req.params as { teamId: string };
  const tr = new Transaction();

  tr.addTr(async (trx) => {
    return await createEvent({...req.body, teamId}, req.user?.sub!, trx);
  });

  const [ eventCreateData ] = await tr.execute();
  const id = eventCreateData.insertId;
  const [ event ] = await getEventById(id) as PublicEvent[];

  res.status(201).json({
    success: true,
    message: 'Event created successfully',
    data: event
  });
})

router.put('/:eventId/team/:teamId', requireSignedIn, validate(createEventSchema), requireScope('event:update', 'team'), async (req: Request, res: Response) => {
  const { eventId, teamId } = req.params as { eventId: string, teamId: string };
  const { ...event } = req.body as Event;

  const tr = new Transaction();

  tr.addTr(async (trx) => {
    return await trx.query(`
      DELETE FROM events WHERE id = ? AND teamId = ?
    `, [eventId, teamId]);
  });

  tr.addTr(async (trx) => {
    return await createEvent({...event, teamId}, req.user?.sub!, trx);
  })

  await tr.execute();

  const [ updatedEvent ] = await getEventById(eventId) as PublicEvent[];

  res.status(200).json({
    success: true,
    message: 'Event updated successfully',
    data: updatedEvent
  });
})

router.get('/team/:teamId', requireSignedIn, requireScope('event:read', 'team'), async (req: Request, res: Response, next: NextFunction) => {
  const { teamId } = req.params as { teamId: string };
  const { startDate, endDate, date, withPlans } = req.query as { startDate: string, endDate: string, date: string, withPlans: 'true' | 'false' };

  let events: PublicEvent[];
  if(date) {
    events = await getEventsByTeamIdDate(teamId, date) as Event[];
  } else {
    events = await getEventsByTeamIdRange(teamId, startDate, endDate) as Event[];
  }

  for(const event of events) {
    if(event.createdById !== req.user?.sub) {
      delete event.ownNotes;
    }
    if(!hasRoleInTeam(req.user!, teamId, ['owner', 'admin', 'coach'])) {
      delete event.coachesNotes;
    }
  }

  if(withPlans === 'true') {
    for (const event of events) {
      console.log('event.id', event.id);
      event.plan = await getPlanByEventId(event.id, teamId);
      console.log('event.plan', event.plan);
    }
  }

  res.status(200).json({
    success: true,
    message: 'Event fetched successfully',
    data: events
  });
});


router.post('/ai-generate/plan', requireSignedIn, async (req: Request, res: Response, next: NextFunction) => {
  const { prompt } = req.body as { prompt: string };
})

// TODO: figure out auth for user events
router.get('/:eventId/team/:teamId', requireSignedIn, requireScope('event:read', 'team'), async (req: Request, res: Response, next: NextFunction) => {
  const { eventId, teamId } = req.params as { eventId: string, teamId: string };
  const [ event ] = await query(`
    SELECT events.*, users.email as createdByEmail, users.fullName as createdByName FROM events
    LEFT JOIN users ON events.createdById = users.id
    WHERE events.id = ? AND events.teamId = ?
  `, [eventId, teamId]) as PublicEvent[];

  if(!event) {
    throw new AppError('Event not found', 404, 'event_not_found');
  }

  const [ location ] = await query(`
    SELECT * FROM locations
    WHERE id = ?
  `, [event.locationId]) as Location[];

  event.location = location || null;

  if(event.createdById !== req.user?.sub) {
    delete event.ownNotes;
  }
  if(!hasRoleInTeam(req.user!, teamId, ['owner', 'admin', 'coach'])) {
    delete event.coachesNotes;
  }

  if(!event) {
    throw new AppError('Event not found', 404, 'event_not_found');
  }
  res.status(200).json({
    success: true,
    message: 'Event fetched successfully',
    data: event
  });
});

export default router;