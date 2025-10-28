import { Router, Request, Response, NextFunction } from 'express';
import { validate } from '@/middleware/validation';
import { requireSignedIn, requireScope } from '@/middleware/auth';
import { getEventsByTeamIdRange, getEventsByTeamIdDate } from '@/db/event';
import { withTransaction } from '@/db/index';
import { createEvent, getEventById } from '@/db/event';
import { createEventSchema } from '@/schemas/event';
import { AppError } from '@/middleware/errors';
import { query } from '@/db/index';
import { PublicEvent } from '@/types/event';
import { Location } from './location';
import { hasRoleInTeam } from '@/utils/authHelper';
import { getPlanByEventId } from '@/utils/planHelper';
import { fetchTeamEvents } from '@/utils/eventHelper';
import { createEventException, getEventException } from '@/db/eventException';
import { Event } from '@/types/event';

const router: Router = Router();

router.post('/team/:teamId', requireSignedIn, validate(createEventSchema), requireScope('event:create', 'team'), async (req: Request, res: Response) => {
  const { teamId } = req.params as { teamId: string };

  const eventCreateData = await createEvent({...req.body, teamId}, req.user?.sub!);

  const id = eventCreateData.insertId;
  const [ event ] = await getEventById(id);

  res.status(201).json({
    success: true,
    message: 'Event created successfully',
    data: event
  });
})

/**
 * Edit an event (supports recurring events with editMode)
 * Query params:
 * - editMode: 'this' | 'all' (for recurring events)
 * - recurrenceDate: date string (YYYY-MM-DD) - required for editMode='this'
 */
router.put('/:eventId/team/:teamId', requireSignedIn, validate(createEventSchema), requireScope('event:update', 'team'), async (req: Request, res: Response) => {
  const { eventId, teamId } = req.params as { eventId: string; teamId: string };
  const { editMode, recurrenceDate } = req.query as { editMode?: 'this' | 'all'; recurrenceDate?: string };
  const updates = req.body;

  const events = await getEventById(eventId);
  const event = events[0];
  if (!event || event.teamId !== teamId) {
    throw new AppError('Event not found', 404, 'event_not_found');
  }

  // Edit entire series: use UPDATE to avoid duplicates and preserve id
  if (event.repeats && editMode === 'all') {
    await withTransaction(async (trx) => {
      const merged: any = { ...event, ...updates };
      const toNull = (v: any) => (v === undefined ? null : v);
      return await trx.query(`
        UPDATE events SET
          title = ?,
          notes = ?,
          type = ?,
          ownNotes = ?,
          coachesNotes = ?,
          eventDate = ?,
          startTimeUnixSec = ?,
          endTimeUnixSec = ?,
          locationId = ?,
          timezone = ?,
          repeats = ?,
          repeatsOn = ?,
          repeatsUntilUnixSec = ?,
          status = ?,
          durationInMinutes = ?
        WHERE id = ? AND teamId = ?
      `, [
        merged.title,
        toNull(merged.notes),
        merged.type,
        toNull(merged.ownNotes),
        toNull(merged.coachesNotes),
        merged.eventDate,
        toNull(merged.startTimeUnixSec),
        toNull(merged.endTimeUnixSec),
        toNull(merged.locationId),
        merged.timezone || 'Europe/Helsinki',
        toNull(merged.repeats),
        toNull(merged.repeatsOn),
        toNull(merged.repeatsUntilUnixSec),
        toNull(merged.status) || 'published',
        toNull(merged.durationInMinutes),
        eventId,
        teamId
      ]);
    });
    const [updatedEvent] = await getEventById(eventId);

    if (!updatedEvent) {
      throw new AppError('Event not found', 404, 'something_went_wrong');
    }

    return res.status(200).json({
      success: true,
      message: 'Event updated successfully',
      data: updatedEvent
    });
  }

  // Non-repeating event or unspecified editMode: use DELETE+INSERT strategy
  if (!event.repeats || !editMode) {
    await withTransaction(async (trx) => {
      await trx.query(`
        DELETE FROM events WHERE id = ? AND teamId = ?
      `, [eventId, teamId]);

      return await createEvent({ id: eventId, ...updates, teamId }, req.user?.sub!, trx);
    });
    const [updatedEvent] = await getEventById(eventId);

    if (!updatedEvent) {
      throw new AppError('Event not found', 404, 'something_went_wrong');
    }

    return res.status(200).json({
      success: true,
      message: 'Event updated successfully',
      data: updatedEvent
    });
  }

  if (!recurrenceDate) {
    throw new AppError('recurrenceDate required for recurring event edits', 400, 'missing_recurrence_date');
  }

  if (editMode === 'this') {
    // Edit single occurrence: create replacement event + exception
    console.log('🔄 Starting editMode=this transaction...');

    const replacedEvent = await withTransaction(async (trx) => {
      console.log('📝 Creating replacement event...');
      // Create replacement event
      const replacementResult = await createEvent(
        {
          ...updates,
          teamId,
          eventDate: recurrenceDate,
          repeats: null, // Single event, not recurring
          repeatsOn: null,
          repeatsUntilUnixSec: null,
        },
        req.user!.sub,
        trx
      );
      const replacementId = (replacementResult as any)?.insertId ?? (replacementResult as any)?.id ?? replacementResult;
      console.log('✅ Replacement event created with ID:', replacementId);

      console.log('📝 Creating exception...');
      // Create exception pointing to replacement
      await createEventException(
        event.id,
        recurrenceDate,
        false,
        Number(replacementId),
        trx
      );

      const replacementEventResult = await getEventById(replacementId) as Event[];
      return replacementEventResult[0] || null;
    });

    return res.status(200).json({ success: true, message: 'Occurrence updated', data: replacedEvent });
  }

  throw new AppError('Invalid editMode', 400, 'invalid_edit_mode');
});

router.get('/team/:teamId', requireSignedIn, requireScope('event:read', 'team'), async (req: Request, res: Response, next: NextFunction) => {
  const { teamId } = req.params as { teamId: string };
  const { startDate, endDate, date, withPlans } = req.query as { startDate: string, endDate: string, date: string, withPlans: 'true' | 'false' };

  const events = await fetchTeamEvents(teamId, date, startDate, endDate);

  if(!events) {
    throw new AppError('Events not found', 404, 'something_went_wrong');
  }

  for(const event of events) {
    if(event.createdById !== req.user?.sub) {
      (event as any).ownNotes = undefined;
    }
    if(!hasRoleInTeam(req.user!, teamId, ['owner', 'admin', 'coach'])) {
      (event as any).coachesNotes = undefined;
    }
  }

  if(withPlans === 'true') {
    for (const event of events) {
      (event as any).plan = await getPlanByEventId(event.id, teamId);
    }
  }

  res.status(200).json({
    success: true,
    message: 'Event fetched successfully',
    data: events
  });
});

/**
 * Get a specific event (or specific occurrence of a recurring event)
 * Query params:
 * - recurrenceDate: date string (YYYY-MM-DD) - if provided, gets the specific occurrence
 */
router.get('/:eventId/team/:teamId', requireSignedIn, requireScope('event:read', 'team'), async (req: Request, res: Response, next: NextFunction) => {
  const { eventId, teamId } = req.params as { eventId: string, teamId: string };
  const { recurrenceDate } = req.query as { recurrenceDate?: string };

  const [ event ] = await query(`
    SELECT events.*, users.email as createdByEmail, users.fullName as createdByName FROM events
    LEFT JOIN users ON events.createdById = users.id
    WHERE events.id = ? AND events.teamId = ?
  `, [eventId, teamId]) as PublicEvent[];

  if(!event) {
    throw new AppError('Event not found', 404, 'event_not_found');
  }

  // If requesting a specific occurrence, check for exceptions
  if (recurrenceDate && event.repeats) {
    const exception = await getEventException(
      event.id,
      recurrenceDate
    );

    if (exception) {
      if (exception.isCancelled) {
        throw new AppError('This occurrence has been cancelled', 404, 'occurrence_cancelled');
      }
      if (exception.replacementEventId) {
        // Return the replacement event instead
        const [replacementEvent] = await getEventById(exception.replacementEventId.toString());
        if (!replacementEvent) {
          throw new AppError('Replacement event not found', 404, 'replacement_not_found');
        }

        const [ location ] = await query(`
          SELECT * FROM locations WHERE id = ?
        `, [replacementEvent.locationId]) as Location[];

        (replacementEvent as any).location = location || null;

        if(replacementEvent.createdById !== req.user?.sub) {
          (replacementEvent as any).ownNotes = undefined;
        }

        if(!hasRoleInTeam(req.user!, teamId, ['owner', 'admin', 'coach'])) {
          (replacementEvent as any).coachesNotes = undefined;
        }

        (replacementEvent as any).repeatId = recurrenceDate;
        (replacementEvent as any).exception = true;

        return res.status(200).json({
          success: true,
          message: 'Event fetched successfully',
          data: replacementEvent
        });
      }
    }

    // No exception, return the base event with the specific occurrence date
    (event as any).eventDate = recurrenceDate;
    (event as any).repeatId = recurrenceDate;
  }

  // If no recurrenceDate was provided and this event is a replacement event,
  // attach the repeatId based on the exception row that points to this replacement
  if (!recurrenceDate) {
    const excRows = await query(`
      SELECT recurrenceDate FROM event_exceptions WHERE replacementEventId = ? LIMIT 1
    `, [event.id]) as { recurrenceDate: string }[];
    if (excRows && excRows[0]) {
      (event as any).repeatId = excRows[0].recurrenceDate;
    }
  }

  const [ location ] = await query(`
    SELECT * FROM locations WHERE id = ?
  `, [event.locationId]) as Location[];

  event.location = location || null;

  if(event.createdById !== req.user?.sub) {
    delete event.ownNotes;
  }

  if(!hasRoleInTeam(req.user!, teamId, ['owner', 'admin', 'coach'])) {
    delete event.coachesNotes;
  }

  return res.status(200).json({
    success: true,
    message: 'Event fetched successfully',
    data: event
  });
});

/**
 * Delete/cancel a recurring event occurrence
 * Query params:
 * - recurrenceDate: date string (YYYY-MM-DD) - if provided, cancels just that occurrence
 */
router.delete('/:eventId/team/:teamId', requireSignedIn, requireScope('event:delete', 'team'), async (req: Request, res: Response) => {
  const { eventId, teamId } = req.params as { eventId: string; teamId: string };
  const { recurrenceDate } = req.query as { recurrenceDate?: string };

  const events = await getEventById(eventId);
  const event = events[0];
  if (!event || event.teamId !== teamId) {
    throw new AppError('Event not found', 404, 'event_not_found');
  }

  if (recurrenceDate) {
    // Cancel single occurrence (only valid for recurring events)
    if (!event.repeats) {
      throw new AppError('Cannot cancel occurrence of non-recurring event', 400, 'not_recurring_event');
    }

    await createEventException(
      event.id,
      recurrenceDate,
      true, // isCancelled
      null
    );
    return res.json({ success: true, message: 'Occurrence cancelled' });
  }

  // Delete entire event/series
  await query(`DELETE FROM events WHERE id = ?`, [eventId]);
  return res.json({ success: true, message: 'Event deleted' });
});

export default router;