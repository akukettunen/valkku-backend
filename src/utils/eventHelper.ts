import { getEventsByTeamIdDate, getEventsByTeamIdRange, getTeamEvents, getEventById } from "@/db/event";
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

export const fetchTeamEvents = async (teamId: string, date: string, startDate: string, endDate: string, userId?: string) => {
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
  } catch (error) {
    console.error('❌ Error fetching team events:', error);
    throw new AppError('Failed to fetch team events', 500, 'something_went_wrong');
  }

  return events;
}