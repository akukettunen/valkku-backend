import { getEventsByTeamIdDate, getEventsByTeamIdRange, getTeamEvents, getEventById } from "@/db/event";
import { query, Transaction } from "@/db/index";
import { AppError } from "@/middleware/errors";
import type { Event } from "@/types/event";

/**
 * Expand repeat events into individual instances within a date range
 * This function generates ALL instances of a repeating event that fall within the date range,
 * regardless of whether the base event is in the range or not.
 */
const expandRepeats = (events: Event[], startDate: string, endDate: string, debug = false): Event[] => {
  const expanded: Event[] = [];
  // Parse dates as UTC to avoid timezone issues
  const startStr = startDate.split('T')[0] || startDate;
  const endStr = endDate.split('T')[0] || endDate;
  const start = new Date(startStr + 'T00:00:00.000Z');
  const end = new Date(endStr + 'T23:59:59.999Z');

  if (debug) {
    console.log(`\n🔍 EXPAND REPEATS: Looking for events between ${startDate} and ${endDate}`);
    console.log(`   Start: ${start.toISOString()}, End: ${end.toISOString()}`);
  }

  // Preserve the time-of-day from original timestamp when moving to a new date
  // This accounts for DST changes by extracting hours/minutes and reapplying them
  const recomputeUnix = (baseDate: Date, originalUnix: any, originalDate: Date, eventTitle?: string, timezone?: string): any => {
    // If no time is set (null/undefined/0), keep it as-is (all-day event)
    if (!originalUnix) return originalUnix;

    const origNum = typeof originalUnix === 'number' && Number.isFinite(originalUnix)
      ? originalUnix
      : Number(originalUnix);
    if (!Number.isFinite(origNum)) return originalUnix;

    // If no timezone specified, fall back to UTC-based calculation
    if (!timezone) {
      const origDate = new Date(origNum * 1000);
      const hours = origDate.getUTCHours();
      const minutes = origDate.getUTCMinutes();
      const seconds = origDate.getUTCSeconds();

      const newDate = new Date(baseDate);
      newDate.setUTCHours(hours, minutes, seconds, 0);
      return Math.floor(newDate.getTime() / 1000);
    }

    try {
      // Get the local time-of-day from the original timestamp in the event's timezone
      const origDate = new Date(origNum * 1000);

      // Format the original time in the event's timezone to get local time components
      const formatter = new Intl.DateTimeFormat('en-CA', {
        timeZone: timezone,
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        hour12: false
      });

      const parts = formatter.formatToParts(origDate);
      const hours = parseInt(parts.find(p => p.type === 'hour')?.value || '0');
      const minutes = parseInt(parts.find(p => p.type === 'minute')?.value || '0');
      const seconds = parseInt(parts.find(p => p.type === 'second')?.value || '0');

      // Create a new date with the same local time-of-day on the new date
      // We need to construct this in the event's timezone
      const baseDateStr = baseDate.toISOString().split('T')[0]; // YYYY-MM-DD
      const timeStr = `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;

      // Create a date string in the event's timezone and convert to UTC
      const localDateTimeStr = `${baseDateStr}T${timeStr}`;

      // Parse this as if it's in the event's timezone and convert to UTC
      const tempDate = new Date(localDateTimeStr);

      // Calculate the timezone offset for the new date in the event's timezone
      const tempDateInTimezone = new Date(tempDate.toLocaleString('en-US', { timeZone: timezone }));
      const offset = tempDate.getTime() - tempDateInTimezone.getTime();

      const result = Math.floor((tempDate.getTime() + offset) / 1000);

      console.log(`🕐 [${eventTitle || 'Unknown'}] (${timezone})`);
      console.log(`   Original: ${origDate.toISOString()} (${origNum})`);
      console.log(`   Local time in ${timezone}: ${hours}:${minutes}:${seconds}`);
      console.log(`   Base date: ${baseDate.toISOString()}`);
      console.log(`   New local time: ${localDateTimeStr}`);
      console.log(`   Result: ${result}`);

      return result;
    } catch (error) {
      console.warn(`⚠️  Timezone conversion failed for ${timezone}, falling back to UTC:`, error);

      // Fallback to UTC-based calculation
      const origDate = new Date(origNum * 1000);
      const hours = origDate.getUTCHours();
      const minutes = origDate.getUTCMinutes();
      const seconds = origDate.getUTCSeconds();

      const newDate = new Date(baseDate);
      newDate.setUTCHours(hours, minutes, seconds, 0);
      return Math.floor(newDate.getTime() / 1000);
    }
  };

  for (const event of events) {
    // With dateStrings: true, eventDate is always a string like "2025-10-01"
    const eventDateStr = (event.eventDate as string).split('T')[0];
    const eventDate = new Date(eventDateStr + 'T00:00:00.000Z');

    if (debug) {
      console.log(`\n📅 Event ${event.id}: "${event.title}"`);
      console.log(`   Base date: ${event.eventDate}`);
      console.log(`   Repeats: ${event.repeats}, RepeatsOn: ${event.repeatsOn}, Until: ${event.repeatsUntilUnixSec || 'forever'}`);
    }

    // Handle repeats
    if (event.repeats) {
      // Determine the end date for repeating
      let repeatEnd: Date;
      if (event.repeatsUntilUnixSec) {
        const repeatUntil = event.repeatsUntilUnixSec;
        // Handle different formats: date string, unix timestamp (number or string)
        if (typeof repeatUntil === 'string' && repeatUntil.includes('-')) {
          // Date string format: "2025-11-06"
          const dateStr = repeatUntil.split('T')[0];
          repeatEnd = new Date(dateStr + 'T23:59:59.999Z');
        } else {
          // Unix timestamp (seconds): could be number or numeric string
          const timestamp = typeof repeatUntil === 'number' ? repeatUntil : parseInt(repeatUntil);
          repeatEnd = new Date(timestamp * 1000);
        }
        if (debug) console.log(`   Repeats until: ${repeatEnd.toISOString().split('T')[0]}`);
      } else {
        repeatEnd = end;
        if (debug) console.log(`   Repeats forever (capped to query end)`);
      }
      const actualEnd = end < repeatEnd ? end : repeatEnd;

      if (event.repeats === 'daily') {
        // Daily repeats - if repeatsOn is set, only repeat on specific days
        // Start from the event date or query start, whichever is later
        let currentDate = new Date(eventDate > start ? eventDate : start);

        while (currentDate <= actualEnd) {
          // Check if we should include this day
          let shouldInclude = true;
          if (event.repeatsOn) {
            const dayOfWeek = (currentDate.getUTCDay() + 6) % 7; // Convert to 0=Monday, 6=Sunday (use UTC to avoid timezone issues)
            shouldInclude = event.repeatsOn[dayOfWeek] === '1';
          }

          if (shouldInclude && currentDate >= start && currentDate <= end) {
            const dateStr = currentDate.toISOString().split('T')[0];
            if (debug) console.log(`   ✅ ${dateStr} (day ${(currentDate.getUTCDay() + 6) % 7})`);
            const expandedEvent: any = {
              ...event,
              eventDate: dateStr || '',
              startTimeUnixSec: recomputeUnix(currentDate, (event as any).startTimeUnixSec, eventDate, event.title, event.timezone),
              endTimeUnixSec: recomputeUnix(currentDate, (event as any).endTimeUnixSec, eventDate, event.title, event.timezone),
            };
            (expandedEvent as any).repeatId = dateStr || '';
            expanded.push(expandedEvent);
          }
          currentDate.setUTCDate(currentDate.getUTCDate() + 1);
        }
      } else if (event.repeats === 'weekly') {
        // Weekly repeats - every week on the same day of the week
        let currentDate = new Date(eventDate);
        if (debug) console.log(`   Starting from: ${currentDate.toISOString().split('T')[0]}`);

        // If event is before range, fast-forward to first week in range
        if (currentDate < start) {
          const daysDiff = Math.floor((start.getTime() - currentDate.getTime()) / (1000 * 60 * 60 * 24));
          const weeksDiff = Math.floor(daysDiff / 7);
          currentDate.setUTCDate(currentDate.getUTCDate() + (weeksDiff * 7));
          if (debug) console.log(`   Fast-forwarded by ${weeksDiff} weeks to: ${currentDate.toISOString().split('T')[0]}`);

          // If we're still before start, add one more week
          if (currentDate < start) {
            currentDate.setUTCDate(currentDate.getUTCDate() + 7);
            if (debug) console.log(`   Added 1 more week to: ${currentDate.toISOString().split('T')[0]}`);
          }
        }

        while (currentDate <= actualEnd && currentDate <= end) {
          const dateStr = currentDate.toISOString().split('T')[0];
          if (currentDate >= start && currentDate <= end) {
            if (debug) console.log(`   ✅ ${dateStr}`);
            const expandedEvent: any = {
              ...event,
              eventDate: dateStr || '',
              startTimeUnixSec: recomputeUnix(currentDate, (event as any).startTimeUnixSec, eventDate, event.title, event.timezone),
              endTimeUnixSec: recomputeUnix(currentDate, (event as any).endTimeUnixSec, eventDate, event.title, event.timezone),
            };
            (expandedEvent as any).repeatId = dateStr || '';
            expanded.push(expandedEvent);
          } else {
            if (debug) console.log(`   ❌ ${dateStr} (not in range)`);
          }
          currentDate.setUTCDate(currentDate.getUTCDate() + 7);
        }
      } else if (event.repeats === 'monthly') {
        // Monthly repeats - same day of month each month
        let currentDate = new Date(eventDate);

        // If event is before range, fast-forward to first month in range
        if (currentDate < start) {
          while (currentDate < start && currentDate <= actualEnd) {
            currentDate.setUTCMonth(currentDate.getUTCMonth() + 1);
          }
        }

        while (currentDate <= actualEnd && currentDate <= end) {
          if (currentDate >= start) {
            const expandedEvent: any = {
              ...event,
              eventDate: currentDate.toISOString().split('T')[0] || '',
              startTimeUnixSec: recomputeUnix(currentDate, (event as any).startTimeUnixSec, eventDate, event.title, event.timezone),
              endTimeUnixSec: recomputeUnix(currentDate, (event as any).endTimeUnixSec, eventDate, event.title, event.timezone),
            };
            (expandedEvent as any).repeatId = currentDate.toISOString().split('T')[0] || '';
            expanded.push(expandedEvent);
          }
          currentDate.setUTCMonth(currentDate.getUTCMonth() + 1);
        }
      }
    }
  }

  return expanded;
};

/**
 * Apply exceptions to expanded events:
 * - Remove cancelled occurrences
 * - Replace modified occurrences with replacement events
 */
const applyExceptions = async (
  expandedEvents: Event[],
  startDate: string,
  endDate: string
): Promise<Event[]> => {
  // Group events by base ID
  const eventsByBaseId = new Map<number, Event[]>();
  for (const event of expandedEvents) {
    const baseId = event.id;
    if (!eventsByBaseId.has(baseId)) {
      eventsByBaseId.set(baseId, []);
    }
    eventsByBaseId.get(baseId)!.push(event);
  }

  // Fetch exceptions for all recurring events
  const allExceptions = new Map<string, any>();
  const replacementIds = new Set<number>();
  for (const baseId of eventsByBaseId.keys()) {
    // const exceptions = await getEventExceptionsInRange(baseId, startDate, endDate);
    // for (const exc of exceptions) {
    //   const key = `${exc.eventId}-${exc.recurrenceDate}`;
    //   allExceptions.set(key, exc);
    //   if (exc.replacementEventId) {
    //     replacementIds.add(exc.replacementEventId);
    //   }
    // }
  }

  // Filter and replace
  const result: Event[] = [];
  for (const event of expandedEvents) {
    // If this event is itself a replacement event (standalone non-repeating created for an exception),
    // skip it to avoid duplicates. We'll inject the replacement details when we hit the matching base occurrence.
    if (replacementIds.has((event as any).id)) {
      continue;
    }
    const repeatId = (event as any).repeatId;
    const key = `${event.id}-${repeatId || event.eventDate}`;
    const exception = allExceptions.get(key);

    if (exception) {
      if (exception.isCancelled) {
        continue; // Skip cancelled occurrence
      }
      if (exception.replacementEventId) {
        // Replace with the replacement event, but keep base series id and repeatId
        const replacements = await getEventById(exception.replacementEventId.toString());
        const replacement = replacements[0];
        if (replacement) {
          const replacedOccurrence: any = {
            ...replacement,
            // Preserve series identity
            id: event.id,
            // Ensure the occurrence date is the requested one
            eventDate: repeatId || event.eventDate,
          };
          // Explicitly carry the repeatId forward for clients
          replacedOccurrence.repeatId = repeatId || event.eventDate;
          // Mark that this occurrence is produced by an exception replacement
          replacedOccurrence.exception = true;
          result.push(replacedOccurrence as Event);
        }
        continue;
      }
    }
    result.push(event);
  }

  return result;
};

/**
 * Filter events based on user access
 * Athletes: See events where forAllAthletes=1 OR they created it OR they're invited
 * Staff: See events where forAllStaff=1 OR they created it OR they're invited
 */
export const filterEventsByUserAccess = (events: Event[], userId: string, isAthlete: boolean): Event[] => {
  return events.filter((event: any) => {
    // Allow if user created the event
    if (event.createdById === userId) {
      return true;
    }

    // Allow if event is explicitly owned by the athlete
    if (event.athleteId && event.athleteId === userId) {
      return true;
    }

    // Allow based on role
    if (isAthlete) {
      if (event.forAllAthletes === 1 || event.forAllAthletes === true) {
        return true;
      }
    } else {
      if (event.forAllStaff === 1 || event.forAllStaff === true) {
        return true;
      }
    }

    // Allow if user is invited (exists in eventUsers array)
    if (event.eventUsers && Array.isArray(event.eventUsers)) {
      const isInvited = event.eventUsers.some((eu: any) => eu.userId === userId);
      if (isInvited) {
        return true;
      }
    }

    return false;
  });
};

/**
 * Fetch and filter events for a team with all necessary relations
 * This is the unified function used by both API routes and calendar generation
 */
export const getFilteredTeamEvents = async (
  teamId: string,
  userId: string,
  userRoles: Array<{ role: string; guardianOf?: string | null }>,
  options?: {
    date?: string;
    startDate?: string;
    endDate?: string;
    withPlans?: boolean;
    includeAttendances?: boolean;
  }
) => {
  const { models } = await import('@/db/index');
  const { Op } = await import('sequelize');

  // Build where clause based on date parameters
  const where: any = { teamId };
  if (options?.date) {
    const dateStr = options.date.split('T')[0];
    where.eventDate = dateStr;
  } else if (options?.startDate && options?.endDate) {
    const startStr = options.startDate.split('T')[0];
    const endStr = options.endDate.split('T')[0];
    where.eventDate = {
      [Op.between]: [startStr, endStr]
    };
  }

  // Determine user's role
  const isStaff = userRoles.some(r => ['owner', 'admin', 'coach'].includes(r.role));
  const isAthlete = userRoles.some(r => r.role === 'athlete' && !r.guardianOf);
  const guardianRole = userRoles.find(r => r.role === 'guardian' && r.guardianOf);

  // For guardians, filter events as if we're the guarded person
  const filterUserId = guardianRole?.guardianOf || userId;

  // Build include array
  const include: any[] = [
    {
      model: models.locations,
      as: 'location'
    },
    {
      model: models.users,
      as: 'athlete',
      attributes: ['id', 'firstName', 'lastName', 'email', 'fullName'],
      required: false
    },
    {
      model: models.eventUsers,
      as: 'eventUsers',
      required: false,
      include: [
        { model: models.users, as: 'user', attributes: ['id', 'firstName', 'lastName', 'email'] }
      ]
    }
  ];

  // Optionally include attendances
  if (options?.includeAttendances) {
    include.push({
      model: models.userEventAttendances,
      as: 'userEventAttendances',
      required: false,
      include: [
        { model: models.users, as: 'user', attributes: ['id', 'firstName', 'lastName', 'email'] }
      ]
    });
  }

  const eventRows = await models.events.findAll({
    where,
    order: [['eventDate', 'ASC'], ['startTimeUnixSec', 'ASC']],
    include
  });

  let events = eventRows.map(row => row.get({ plain: true })) as unknown as Event[];

  // Attach athlete name/email for convenience
  for (const ev of events as any[]) {
    if (ev.athlete) {
      ev.athleteName = ev.athlete.fullName || [ev.athlete.firstName, ev.athlete.lastName].filter(Boolean).join(' ').trim();
      ev.athleteEmail = ev.athlete.email;
    }
  }

  // Staff see all events, athletes/guardians get filtered
  if (!isStaff) {
    events = filterEventsByUserAccess(events, filterUserId, isAthlete || !!guardianRole);
  }

  // Extract userIds from eventUsers relation
  for (const event of events) {
    if ((event as any).eventUsers) {
      (event as any).userIds = (event as any).eventUsers.map((eu: any) => eu.userId);
    } else {
      (event as any).userIds = [];
    }
  }

  // Optionally add plans
  if (options?.withPlans) {
    const { getPlanByEventId } = await import('@/utils/planHelper');
    for (const event of events) {
      (event as any).plan = await getPlanByEventId(event.id, teamId);
    }
  }

  return events;
};

export const fetchTeamEvents = async (teamId: string, date: string, startDate: string, endDate: string, userId?: string, isAthlete?: boolean) => {
  let events: Event[] = [];

  try {
    // Load initialized Sequelize model and fetch all team events once
    const { models } = await import('@/db/index');
    const EventsModel = models.events;
    const rows = await EventsModel.findAll({
      where: { teamId },
      order: [['eventDate', 'ASC']],
      include: [
        { model: models.locations },
        {
          model: models.eventUsers,
          as: 'eventUsers',
          required: false
        },
        ...(userId ? [{
          model: models.userEventAttendances,
          as: 'userEventAttendances',
          where: date ? { repeatId: date } : {},
          required: false
        }] : [])
      ],
    });
    const allEvents = rows.map(r => r.get({ plain: true })) as unknown as Event[];

    if (date) {
      // Single date - need to handle repeats that land on this date
      // Separate events with repeats from non-repeating events
      const nonRepeatingEvents = allEvents.filter(e => !e.repeats) as Event[];
      const repeatingEvents = allEvents.filter(e => e.repeats) as Event[];
      console.log(`   📊 Total: ${allEvents.length} (${nonRepeatingEvents.length} non-repeating, ${repeatingEvents.length} repeating)`);

      // Filter non-repeating events to only those on this date
      const nonRepeatingOnDate = nonRepeatingEvents.filter(e => {
        const eventDateStr = (e.eventDate as string).split('T')[0];
        const queryDateStr = date.split('T')[0];
        return eventDateStr === queryDateStr;
      });

      if (nonRepeatingOnDate.length > 0) {
        console.log(`   ✅ Found ${nonRepeatingOnDate.length} non-repeating event(s) on this date`);
      }

      // Expand repeating events to get instances on this date
      const expandedRepeats = expandRepeats(repeatingEvents, date, date, true);

      // Combine non-repeating events on date with expanded repeats
      events = [...nonRepeatingOnDate, ...expandedRepeats];

      // Apply exceptions (cancelled/modified occurrences)
      events = await applyExceptions(events, date, date);

      console.log(`\n✨ Returning ${events.length} total event(s) for ${date}\n`);
    } else if (startDate && endDate) {
      // Date range - need to expand repeats
      // Separate events with repeats from non-repeating events
      const nonRepeatingEvents = allEvents.filter(e => !e.repeats) as Event[];
      const repeatingEvents = allEvents.filter(e => e.repeats) as Event[];

      // Filter non-repeating events to only those in range
      const nonRepeatingInRange = nonRepeatingEvents.filter(e => {
        const eventDateStr = (e.eventDate as string).split('T')[0] || e.eventDate;
        const startDateStr = startDate.split('T')[0] || startDate;
        const endDateStr = endDate.split('T')[0] || endDate;
        return eventDateStr >= startDateStr && eventDateStr <= endDateStr;
      });

      // Expand repeating events to get instances in range
      const expandedRepeats = expandRepeats(repeatingEvents, startDate, endDate);

      // Combine non-repeating events in range with expanded repeats
      events = [...nonRepeatingInRange, ...expandedRepeats];

      // Apply exceptions (cancelled/modified occurrences)
      events = await applyExceptions(events, startDate, endDate);
    } else {
      // No date filter - get all events (no repeats expansion needed)
      events = allEvents as Event[];
    }

    // Filter events by user access if userId is provided
    if (userId) {
      events = filterEventsByUserAccess(events, userId, isAthlete || false);
    }
  } catch (error) {
    console.error('❌ Error fetching team events:', error);
    throw new AppError('Failed to fetch team events', 500, 'something_went_wrong');
  }

  return events;
}

/**
 * Sync event_users records for a given event
 * Deletes existing records and creates new ones based on userIds
 */
export const syncEventUsers = async (
  eventId: number,
  userIds: string[],
  teamId: string,
  forAllAthletes: boolean,
  forAllStaff: boolean,
  trx?: Transaction
) => {
  const exec = trx ? trx.query.bind(trx) : query;

  // Delete existing event_users for this event
  await exec(`DELETE FROM event_users WHERE eventId = ?`, [eventId]);

  // If no userIds provided, nothing to insert
  if (userIds.length === 0) {
    return;
  }

  // Get the roles for each userId in the team to determine which users to keep
  const placeholders = userIds.map(() => '?').join(', ');
  const rolesResult = await exec(`
    SELECT DISTINCT tur.userId, tur.role
    FROM team_user_roles tur
    WHERE tur.teamId = ? AND tur.userId IN (${placeholders})
  `, [teamId, ...userIds]) as Array<{ userId: string, role: string }>;

  // Group roles by userId
  const userRoles = new Map<string, string[]>();
  for (const row of rolesResult) {
    if (!userRoles.has(row.userId)) {
      userRoles.set(row.userId, []);
    }
    userRoles.get(row.userId)!.push(row.role);
  }

  // Filter userIds based on flags
  const filteredUserIds = userIds.filter(userId => {
    const roles = userRoles.get(userId) || [];

    // Check if user is an athlete (has 'athlete' role)
    const isAthlete = roles.includes('athlete');

    // Check if user is staff (has owner, admin, or coach role)
    const isStaff = roles.some(r => ['owner', 'admin', 'coach'].includes(r));

    // If forAllAthletes is true, don't save athletes
    if (forAllAthletes && isAthlete && !isStaff) {
      return false;
    }

    // If forAllStaff is true, don't save staff
    if (forAllStaff && isStaff && !isAthlete) {
      return false;
    }

    // If user has both athlete and staff roles, check both conditions
    if (isAthlete && isStaff) {
      // Only exclude if both flags are true
      if (forAllAthletes && forAllStaff) {
        return false;
      }
    }

    return true;
  });

  // Insert filtered event_users
  if (filteredUserIds.length > 0) {
    const insertPlaceholders = filteredUserIds.map(() => '(?, ?)').join(', ');
    const values: any[] = [];
    filteredUserIds.forEach(userId => {
      values.push(eventId, userId);
    });
    await exec(`INSERT INTO event_users (eventId, userId) VALUES ${insertPlaceholders}`, values);
  }
};

/**
 * Set default attendance for users based on role
 * If userIds is provided, sets attendance for those users
 * Otherwise, sets attendance for all users with the specified role in the team
 *
 * @param forAthletes - If true, get athletes; if false, get staff (owner, admin, coach)
 * @param userIds - Optional list of specific user IDs to set attendance for
 */
export const setDefaultAttendance = async (
  eventId: number,
  teamId: string,
  userIds: string[] | undefined,
  eventDate: string,
  forAthletes: boolean,
  trx?: Transaction
) => {
  const exec = trx ? trx.query.bind(trx) : query;

  let targetUserIds: string[];

  if (userIds !== undefined) {
    // userIds was explicitly provided (could be empty or have values)
    // Filter to only include users with the correct role
    if (userIds.length === 0) {
      // Empty array means no users to set attendance for
      return;
    }

    // Get the roles of the provided users
    const placeholders = userIds.map(() => '?').join(', ');
    let roleCondition: string;
    if (forAthletes) {
      roleCondition = `tur.role = 'athlete'`;
    } else {
      roleCondition = `tur.role IN ('owner', 'admin', 'coach')`;
    }

    const filteredUsers = await exec(`
      SELECT DISTINCT tur.userId
      FROM team_user_roles tur
      WHERE tur.teamId = ?
        AND tur.userId IN (${placeholders})
        AND ${roleCondition}
    `, [teamId, ...userIds]) as Array<{ userId: string }>;

    targetUserIds = filteredUsers.map(u => u.userId);
  } else {
    // userIds was not provided - get all users with the specified role
    let roleCondition: string;
    if (forAthletes) {
      // Get all athletes (excluding guardian-only users)
      roleCondition = `tur.role = 'athlete'`;
    } else {
      // Get all staff (owner, admin, coach) excluding guardian-only users
      roleCondition = `tur.role IN ('owner', 'admin', 'coach')`;
    }

    const users = await exec(`
      SELECT DISTINCT tur.userId
      FROM team_user_roles tur
      INNER JOIN team_users tu ON tur.userId = tu.userId AND tur.teamId = tu.teamId
      WHERE tur.teamId = ?
        AND ${roleCondition}
        AND tu.status = 'active'
        AND NOT EXISTS (
          SELECT 1 FROM team_user_roles tur2
          WHERE tur2.userId = tur.userId
            AND tur2.teamId = tur.teamId
            AND tur2.role = 'guardian'
            AND NOT EXISTS (
              SELECT 1 FROM team_user_roles tur3
              WHERE tur3.userId = tur.userId
                AND tur3.teamId = tur.teamId
                AND tur3.role != 'guardian'
            )
        )
    `, [teamId]) as Array<{ userId: string }>;

    targetUserIds = users.map(u => u.userId);
  }

  // Insert attendance records for all relevant users
  if (targetUserIds.length > 0) {
    const placeholders = targetUserIds.map(() => '(?, ?, ?, ?)').join(', ');
    const values: any[] = [];
    targetUserIds.forEach(userId => {
      values.push(userId, eventId, eventDate, true); // attends = true
    });

    await exec(`
      INSERT INTO user_event_attendances (userId, eventId, repeatId, attends)
      VALUES ${placeholders}
      ON DUPLICATE KEY UPDATE
        attends = VALUES(attends),
        updatedAt = CURRENT_TIMESTAMP
    `, values);
  }
};