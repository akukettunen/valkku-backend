import { Router, Request, Response, NextFunction } from 'express';
import { validate } from '@/middleware/validation';
import { requireSignedIn, requireScope } from '@/middleware/auth';
import { withTransaction } from '@/db/index';
import { createEvent, getEventById } from '@/db/event';
import { createEventSchema } from '@/schemas/event';
import { AppError } from '@/middleware/errors';
import { query } from '@/db/index';
import { hasRoleInTeam } from '@/utils/authHelper';
import { getPlanByEventId } from '@/utils/planHelper';
import { Event } from '@/types/event';
import { models } from '@/db/index';
import { Op } from 'sequelize';
import { toZonedTime, fromZonedTime } from 'date-fns-tz';

const router: Router = Router();

router.post('/team/:teamId', requireSignedIn, validate(createEventSchema), requireScope('event:create', 'team'), async (req: Request, res: Response) => {
  const { teamId } = req.params as { teamId: string };
  const eventData = req.body;

  // If this is a weekly repeating event, generate all occurrences and save them
  if (eventData.repeats === 'weekly' && eventData.repeatsUntilUnixSec) {
    let occurrencesCount = 0;
    const firstEvent = await withTransaction(async (trx) => {
      const startDate = new Date(eventData.eventDate + 'T00:00:00.000Z');
      const endDate = new Date(eventData.repeatsUntilUnixSec * 1000);
      const occurrences: any[] = [];

      // Helper function to recalculate Unix timestamp for a new date
      // Properly handles DST transitions using date-fns-tz
      const recomputeUnix = (baseDate: Date, originalUnix: number | null | undefined, timezone: string): number | null => {
        if (!originalUnix) return originalUnix || null;

        const origNum = typeof originalUnix === 'number' && Number.isFinite(originalUnix)
          ? originalUnix
          : Number(originalUnix);
        if (!Number.isFinite(origNum)) return originalUnix;

        try {
          // Convert original Unix timestamp to Date in UTC
          const origDate = new Date(origNum * 1000);

          // Get the local time in the event's timezone
          const zonedOriginal = toZonedTime(origDate, timezone);

          // Extract time-of-day components (these are the local time components we want to preserve)
          const hours = zonedOriginal.getHours();
          const minutes = zonedOriginal.getMinutes();
          const seconds = zonedOriginal.getSeconds();

          // Get the new date string (YYYY-MM-DD)
          const baseDateStr = baseDate.toISOString().split('T')[0]!;
          const dateParts = baseDateStr.split('-');

          // Create a Date object with the new date but same local time-of-day
          // This is a "naive" local date that we'll interpret as being in the event's timezone
          const year = parseInt(dateParts[0]!);
          const month = parseInt(dateParts[1]!) - 1; // JavaScript months are 0-indexed
          const day = parseInt(dateParts[2]!);

          const newLocalDate = new Date(year, month, day, hours, minutes, seconds);

          // Convert from the event's timezone to UTC
          // This automatically handles DST - if the new date is in a different DST period,
          // the UTC offset will be adjusted accordingly
          const newUtcDate = fromZonedTime(newLocalDate, timezone);

          return Math.floor(newUtcDate.getTime() / 1000);
        } catch (error) {
          console.error('DST conversion error:', error);
          // Fallback to UTC-based calculation
          const origDate = new Date(origNum * 1000);
          const hours = origDate.getUTCHours();
          const minutes = origDate.getUTCMinutes();
          const secs = origDate.getUTCSeconds();

          const newDate = new Date(baseDate);
          newDate.setUTCHours(hours, minutes, secs, 0);
          return Math.floor(newDate.getTime() / 1000);
        }
      };

      // Generate all weekly occurrences
      let currentDate = new Date(startDate);
      const timezone = eventData.timezone || 'Europe/Helsinki';

      while (currentDate <= endDate) {
        const dateStr = currentDate.toISOString().split('T')[0];
        occurrences.push({
          ...eventData,
          eventDate: dateStr,
          teamId,
          repeats: null, // Individual occurrences don't repeat
          repeatsOn: null,
          repeatsUntilUnixSec: null,
          startTimeUnixSec: recomputeUnix(currentDate, eventData.startTimeUnixSec, timezone),
          endTimeUnixSec: recomputeUnix(currentDate, eventData.endTimeUnixSec, timezone),
        });
        currentDate.setUTCDate(currentDate.getUTCDate() + 7); // Weekly: add 7 days
      }

      occurrencesCount = occurrences.length;

      // Create first occurrence to get its ID
      const firstOccurrence = occurrences[0];
      const firstResult = await createEvent(firstOccurrence, req.user?.sub!, trx);
      const baseEventId = firstResult.insertId;

      // Update first occurrence to have baseEventId set to its own ID
      await trx.query(
        `UPDATE events SET baseEventId = ? WHERE id = ?`,
        [baseEventId, baseEventId]
      );

      // Create remaining occurrences with baseEventId set to first occurrence's ID
      const createdEvents = [{ id: baseEventId, ...firstOccurrence }];
      for (let i = 1; i < occurrences.length; i++) {
        const occurrence = occurrences[i];
        // Ensure eventDate is correctly set for this occurrence
        const occurrenceWithBase = {
          ...occurrence,
          baseEventId,
          eventDate: occurrence.eventDate // Explicitly ensure eventDate is set
        };
        const result = await createEvent(occurrenceWithBase, req.user?.sub!, trx);
        createdEvents.push({ id: result.insertId, ...occurrence });
      }

      return createdEvents[0];
    });

    const [ event ] = await getEventById(firstEvent.id.toString());

    res.status(201).json({
      success: true,
      message: `Event created successfully with ${occurrencesCount} occurrences`,
      data: event
    });
  } else {
    // Non-repeating event - create as before
    const eventCreateData = await createEvent({...req.body, teamId}, req.user?.sub!);

    const id = eventCreateData.insertId;
    const [ event ] = await getEventById(id);

    res.status(201).json({
      success: true,
      message: 'Event created successfully',
      data: event
    });
  }
})

router.put('/:eventId/team/:teamId', requireSignedIn, validate(createEventSchema), requireScope('event:update', 'team'), async (req: Request, res: Response) => {
  const { eventId, teamId } = req.params as { eventId: string; teamId: string };
  const { editMode, recurrenceDate } = req.query as { editMode?: 'this' | 'all' | 'thisAndAfter'; recurrenceDate?: string };
  const updates = req.body;

  const events = await getEventById(eventId);
  const event = events[0];
  if (!event || event.teamId !== teamId) {
    throw new AppError('Event not found', 404, 'event_not_found');
  }

  const merged: any = { ...event, ...updates };
  const toNull = (v: any) => (v === undefined ? null : v);

  // Build common update values
  const updateFields = `
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
    status = ?,
    durationInMinutes = ?,
    planId = ?,
    forAllAthletes = ?`;

  const commonValues = [
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
    toNull(merged.status) || 'published',
    toNull(merged.durationInMinutes),
    toNull(merged.planId),
    merged.forAllAthletes !== undefined ? merged.forAllAthletes : true
  ];

  await withTransaction(async (trx) => {
    if (event.baseEventId && (editMode === 'all' || editMode === 'thisAndAfter')) {
      // Edit entire series or this and future events: need to recalculate times for each occurrence's date
      const timezone = merged.timezone || 'Europe/Helsinki';

      // Check if eventDate was explicitly provided in the request and actually changed
      const eventDateProvidedInRequest = 'eventDate' in updates;
      const eventDateChanged = eventDateProvidedInRequest && merged.eventDate !== event.eventDate;

      const baseEvent = await trx.query(`
        SELECT repeats, repeatsOn FROM events WHERE id = ?
      `, [event.baseEventId]) as any[];
      const isWeeklyRepeating = baseEvent[0]?.repeats === 'weekly';

      // Calculate day-of-week shift if eventDate was explicitly changed
      let dayShift = 0;
      let newRepeatsOn: string | null = null;
      let newWeekday: number | null = null;

      if (eventDateChanged) {
        const oldDate = new Date(event.eventDate + 'T00:00:00.000Z');
        const newDate = new Date(merged.eventDate + 'T00:00:00.000Z');
        const oldDay = oldDate.getUTCDay();
        const newDay = newDate.getUTCDay();
        dayShift = newDay - oldDay;
        newWeekday = newDay;

        // For weekly repeating events, update repeatsOn if day of week changed
        if (isWeeklyRepeating && dayShift !== 0 && baseEvent[0]?.repeatsOn) {
          const oldDays = baseEvent[0].repeatsOn.split(',').map((d: string) => parseInt(d));
          const newDays = oldDays.map((day: number) => {
            let shifted = day + dayShift;
            // Handle wrap-around: 0 = Sunday, 6 = Saturday
            if (shifted < 0) shifted += 7;
            if (shifted > 6) shifted -= 7;
            return shifted;
          }).sort((a: number, b: number) => a - b);
          newRepeatsOn = newDays.join(',');
        }
      }

      // Helper function to recalculate Unix timestamp for a specific date
      const recomputeUnix = (eventDate: string, originalUnix: number | null | undefined, timezone: string): number | null => {
        if (!originalUnix) return originalUnix || null;

        const origNum = typeof originalUnix === 'number' && Number.isFinite(originalUnix)
          ? originalUnix
          : Number(originalUnix);
        if (!Number.isFinite(origNum)) return originalUnix;

        try {
          // Convert original Unix timestamp to Date in UTC
          const origDate = new Date(origNum * 1000);

          // Get the local time in the event's timezone
          const zonedOriginal = toZonedTime(origDate, timezone);

          // Extract time-of-day components (these are the local time components we want to preserve)
          const hours = zonedOriginal.getHours();
          const minutes = zonedOriginal.getMinutes();
          const seconds = zonedOriginal.getSeconds();

          // Parse the event date (YYYY-MM-DD)
          const dateParts = eventDate.split('-');
          const year = parseInt(dateParts[0]!);
          const month = parseInt(dateParts[1]!) - 1; // JavaScript months are 0-indexed
          const day = parseInt(dateParts[2]!);

          // Create a Date object with the event's date but same local time-of-day
          const newLocalDate = new Date(year, month, day, hours, minutes, seconds);

          // Convert from the event's timezone to UTC (handles DST automatically)
          const newUtcDate = fromZonedTime(newLocalDate, timezone);

          return Math.floor(newUtcDate.getTime() / 1000);
        } catch (error) {
          console.error('DST conversion error:', error);
          return originalUnix;
        }
      };

      // Fetch events in the series to get their individual eventDates
      let seriesEvents: Array<{ id: number; eventDate: string }>;

      if (editMode === 'thisAndAfter') {
        // Only get this event and future events
        seriesEvents = await trx.query(`
          SELECT id, eventDate FROM events
          WHERE (baseEventId = ? OR id = ?) AND teamId = ? AND eventDate >= ?
          ORDER BY eventDate ASC
        `, [event.baseEventId, event.baseEventId, teamId, event.eventDate]) as Array<{ id: number; eventDate: string }>;
      } else {
        // Get all events in the series
        seriesEvents = await trx.query(`
          SELECT id, eventDate FROM events
          WHERE (baseEventId = ? OR id = ?) AND teamId = ?
          ORDER BY eventDate ASC
        `, [event.baseEventId, event.baseEventId, teamId]) as Array<{ id: number; eventDate: string }>;
      }

      // Update each event with recalculated times for its specific date
      for (const seriesEvent of seriesEvents) {
        // Determine the eventDate to use for this event
        let updatedEventDate = seriesEvent.eventDate;

        // If eventDate changed and we're editing all events, shift each event's date
        if (eventDateChanged && newWeekday !== null) {
          // Move this event to the same new weekday in its week
          const currentDate = new Date(seriesEvent.eventDate + 'T00:00:00.000Z');
          const currentWeekday = currentDate.getUTCDay();
          const daysToShift = newWeekday - currentWeekday;
          currentDate.setUTCDate(currentDate.getUTCDate() + daysToShift);
          updatedEventDate = currentDate.toISOString().split('T')[0]!;
        }

        const recalculatedStartTime = recomputeUnix(updatedEventDate, merged.startTimeUnixSec, timezone);
        const recalculatedEndTime = recomputeUnix(updatedEventDate, merged.endTimeUnixSec, timezone);

        // Build the values array
        const updateValues = [
          merged.title,
          toNull(merged.notes),
          merged.type,
          toNull(merged.ownNotes),
          toNull(merged.coachesNotes),
          updatedEventDate, // Will be shifted date if day changed, or original date otherwise
          recalculatedStartTime,
          recalculatedEndTime,
          toNull(merged.locationId),
          timezone,
          toNull(merged.status) || 'published',
          toNull(merged.durationInMinutes),
          toNull(merged.planId),
          merged.forAllAthletes !== undefined ? merged.forAllAthletes : true,
          seriesEvent.id,
          teamId
        ];

        await trx.query(`
          UPDATE events SET ${updateFields}
          WHERE id = ? AND teamId = ?
        `, updateValues);

        // Update repeatsOn for the base event if needed
        if (seriesEvent.id === event.baseEventId && newRepeatsOn) {
          await trx.query(`
            UPDATE events SET repeatsOn = ? WHERE id = ?
          `, [newRepeatsOn, event.baseEventId]);
        }
      }
    } else {
      // Edit single event: either standalone or specific occurrence (can change eventDate)
      await trx.query(`
        UPDATE events SET ${updateFields}
        WHERE id = ? AND teamId = ?
      `, [...commonValues, eventId, teamId]);
    }
  });

  const [updatedEvent] = await getEventById(eventId);
  if (!updatedEvent) {
    throw new AppError('Event not found', 404, 'something_went_wrong');
  }

  const message = event.baseEventId && editMode === 'all'
    ? 'Event series updated successfully'
    : event.baseEventId && editMode === 'thisAndAfter'
    ? 'This event and future events updated successfully'
    : 'Event updated successfully';

  return res.status(200).json({
    success: true,
    message,
    data: updatedEvent
  });
});

router.patch('/:eventId/team/:teamId', requireSignedIn, requireScope('event:update', 'team'), async (req: Request, res: Response) => {
  const { eventId, teamId } = req.params as { eventId: string; teamId: string };
  const { editMode } = req.query as { editMode?: 'this' | 'all' | 'thisAndAfter' };
  const { planId } = req.body as { planId: number | null };

  const events = await getEventById(eventId);
  const event = events[0];
  if (!event || event.teamId !== teamId) {
    throw new AppError('Event not found', 404, 'event_not_found');
  }

  await withTransaction(async (trx) => {
    if (event.baseEventId && editMode === 'all') {
      // Update entire series
      await trx.query(`
        UPDATE events SET planId = ?
        WHERE (baseEventId = ? OR id = ?) AND teamId = ?
      `, [planId, event.baseEventId, event.baseEventId, teamId]);
    } else if (event.baseEventId && editMode === 'thisAndAfter') {
      // Update this event and future events
      await trx.query(`
        UPDATE events SET planId = ?
        WHERE (baseEventId = ? OR id = ?) AND teamId = ? AND eventDate >= ?
      `, [planId, event.baseEventId, event.baseEventId, teamId, event.eventDate]);
    } else {
      // Update single event
      await trx.query(`
        UPDATE events SET planId = ?
        WHERE id = ? AND teamId = ?
      `, [planId, eventId, teamId]);
    }
  });

  const [updatedEvent] = await getEventById(eventId);
  if (!updatedEvent) {
    throw new AppError('Event not found', 404, 'something_went_wrong');
  }

  const message = event.baseEventId && editMode === 'all'
    ? 'Event series plan updated successfully'
    : event.baseEventId && editMode === 'thisAndAfter'
    ? 'This event and future events plan updated successfully'
    : 'Event plan updated successfully';

  return res.status(200).json({
    success: true,
    message,
    data: updatedEvent
  });
});

router.get('/team/:teamId', requireSignedIn, requireScope('event:read', 'team'), async (req: Request, res: Response, next: NextFunction) => {
  const { teamId } = req.params as { teamId: string };
  const { startDate, endDate, date, withPlans } = req.query as { startDate: string, endDate: string, date: string, withPlans: 'true' | 'false' };

  // Build where clause based on date parameters
  const where: any = { teamId };
  if (date) {
    // Single date - normalize to YYYY-MM-DD format
    const dateStr = date.split('T')[0];
    where.eventDate = dateStr;
  } else if (startDate && endDate) {
    // Date range
    const startStr = startDate.split('T')[0];
    const endStr = endDate.split('T')[0];
    where.eventDate = {
      [Op.between]: [startStr, endStr]
    };
  }

  const eventRows = await models.events.findAll({
    where,
    order: [['eventDate', 'ASC'], ['startTimeUnixSec', 'ASC']],
    include: [
      {
        model: models.locations,
        as: 'location'
      },
      {
        model: models.userEventAttendances,
        as: 'userEventAttendances',
        required: false,
        include: [
          { model: models.users, as: 'user', attributes: ['id', 'firstName', 'lastName', 'email'] }
        ]
      }
    ]
  });

  const events = eventRows.map(row => row.get({ plain: true })) as unknown as Event[];

  // Filter notes based on permissions
  for(const event of events) {
    if(event.createdById !== req.user?.sub) {
      (event as any).ownNotes = undefined;
    }
    if(!hasRoleInTeam(req.user!, teamId, ['owner', 'admin', 'coach'])) {
      (event as any).coachesNotes = undefined;
    }
  }

  // Add plans if requested
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

router.get('/:eventId/team/:teamId', requireSignedIn, requireScope('event:read', 'team'), async (req: Request, res: Response, next: NextFunction) => {
  const { eventId, teamId } = req.params as { eventId: string, teamId: string };

  const eventModel = await models.events.findOne({
    where: {
      id: eventId,
      teamId: teamId
    },
    include: [
      {
        model: models.locations,
        as: 'location'
      },
      {
        model: models.userEventAttendances,
        as: 'userEventAttendances',
        required: false,
        include: [
          { model: models.users, as: 'user', attributes: ['id', 'firstName', 'lastName', 'email'] }
        ]
      }
    ]
  });

  if(!eventModel) {
    throw new AppError('Event not found', 404, 'event_not_found');
  }

  const event = eventModel.get({ plain: true });

  // Filter notes based on permissions
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

router.delete('/:eventId/team/:teamId', requireSignedIn, requireScope('event:delete', 'team'), async (req: Request, res: Response) => {
  const { eventId, teamId } = req.params as { eventId: string; teamId: string };
  const { deleteAll } = req.query as { deleteAll?: 'true' | 'false' };

  const events = await getEventById(eventId);
  const event = events[0];
  if (!event || event.teamId !== teamId) {
    throw new AppError('Event not found', 404, 'event_not_found');
  }

  // Delete entire series or single event
  if (event.baseEventId && deleteAll === 'true') {
    // Delete all events in the series
    const baseId = event.baseEventId;
    await query(`DELETE FROM events WHERE baseEventId = ? OR id = ?`, [baseId, baseId]);
    return res.json({ success: true, message: 'Event series deleted' });
  } else {
    // Delete single event only
    await query(`DELETE FROM events WHERE id = ?`, [eventId]);
    return res.json({ success: true, message: 'Event deleted' });
  }
});

router.post('/:eventId/user/:userId/attendance', requireSignedIn, requireScope('event:attendance:create', 'individual'), async (req: Request, res: Response) => {
  const { eventId, userId } = req.params as { eventId: string; userId: string; };
  const { attendance, repeatId } = req.body as { attendance?: boolean; repeatId?: string };

  // Verify the event exists and user has access to it
  const [event] = await getEventById(eventId);
  if (!event) {
    throw new AppError('Event not found', 404, 'event_not_found');
  }

  const [ user ] = await query(`
    SELECT * FROM users
    LEFT JOIN team_users ON users.id = team_users.userId
    LEFT JOIN events ON events.teamId = team_users.teamId
    WHERE events.id = ? AND users.id = ?
  `, [eventId, userId]);

  if(!user) {
    throw new AppError('User not found', 404, 'unauthorized');
  }

  // For recurring events, use the provided repeatId or the event's date
  const attendanceRepeatId = repeatId || event.eventDate;

  if (attendance === undefined) {
    // Delete attendance record
    await query(`
      DELETE FROM user_event_attendances
      WHERE userId = ? AND eventId = ? AND repeatId = ?
    `, [userId, eventId, attendanceRepeatId]);

    return res.status(200).json({
      success: true,
      message: 'Attendance deleted successfully',
      data: {
        eventId,
        repeatId: attendanceRepeatId,
        attendance: null
      }
    });
  }

  // Create or update attendance using raw SQL with ON DUPLICATE KEY UPDATE
  await query(`
    INSERT INTO user_event_attendances (userId, eventId, repeatId, attends)
    VALUES (?, ?, ?, ?)
    ON DUPLICATE KEY UPDATE
      attends = VALUES(attends),
      updatedAt = CURRENT_TIMESTAMP
  `, [userId, eventId, attendanceRepeatId, attendance]);

  return res.status(200).json({
    success: true,
    message: 'Attendance updated successfully',
    data: {
      eventId,
      repeatId: attendanceRepeatId,
      attendance
    }
  });
});

export default router;