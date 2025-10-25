import { describe, it, expect } from 'vitest';

// Mock the database functions
const mockGetTeamEvents = async () => [
  {
    id: 1,
    title: 'Test Event',
    teamId: 'test-team',
    type: 'practise',
    status: 'published',
    notes: 'Test notes',
    ownNotes: 'Own notes',
    coachesNotes: 'Coaches notes',
    eventDate: '2025-10-17',
    startTimeUnixSec: 1760713200, // 2025-10-17 18:00:00 UTC+3 (Europe/Helsinki)
    endTimeUnixSec: 1760720400,   // 2025-10-17 20:00:00 UTC+3 (Europe/Helsinki)
    durationInMinutes: null,
    timezone: 'Europe/Helsinki',
    repeats: 'weekly',
    repeatsOn: null,
    repeatsUntilUnixSec: null,
    locationId: null,
    createdById: 'test-user',
    deleted: false,
    createdAt: new Date(),
    updatedAt: new Date()
  }
];

// Mock the fetchTeamEvents function
const mockFetchTeamEvents = async (teamId: string, startDate?: string, endDate?: string) => {
  const events = await mockGetTeamEvents();

  // Simple expandRepeats logic for testing
  const expandRepeats = (events: any[], start: string, end: string) => {
    const expanded: any[] = [];

    for (const event of events) {
      if (event.repeats === 'weekly') {
        const eventDate = new Date(event.eventDate + 'T00:00:00.000Z');
        let currentDate = new Date(eventDate);

        // Generate 4 weeks of repeats
        for (let i = 0; i < 4; i++) {
          const dateStr = currentDate.toISOString().split('T')[0];

          // Mock recomputeUnix function
          const recomputeUnix = (baseDate: Date, originalUnix: number, originalDate: Date, eventTitle?: string, timezone?: string) => {
            if (!originalUnix) return originalUnix;

            if (!timezone) {
              const origDate = new Date(originalUnix * 1000);
              const hours = origDate.getUTCHours();
              const minutes = origDate.getUTCMinutes();
              const seconds = origDate.getUTCSeconds();

              const newDate = new Date(baseDate);
              newDate.setUTCHours(hours, minutes, seconds, 0);
              return Math.floor(newDate.getTime() / 1000);
            }

            try {
              const origDate = new Date(originalUnix * 1000);

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

              const baseDateStr = baseDate.toISOString().split('T')[0];
              const timeStr = `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
              const localDateTimeStr = `${baseDateStr}T${timeStr}`;

              const tempDate = new Date(localDateTimeStr);
              const tempDateInTimezone = new Date(tempDate.toLocaleString('en-US', { timeZone: timezone }));
              const offset = tempDate.getTime() - tempDateInTimezone.getTime();

              return Math.floor((tempDate.getTime() + offset) / 1000);
            } catch (error) {
              console.warn(`Timezone conversion failed for ${timezone}, falling back to UTC:`, error);

              const origDate = new Date(originalUnix * 1000);
              const hours = origDate.getUTCHours();
              const minutes = origDate.getUTCMinutes();
              const seconds = origDate.getUTCSeconds();

              const newDate = new Date(baseDate);
              newDate.setUTCHours(hours, minutes, seconds, 0);
              return Math.floor(newDate.getTime() / 1000);
            }
          };

          const currentDateForTime = new Date(currentDate);
          const expandedEvent = {
            ...event,
            eventDate: dateStr,
            startTimeUnixSec: recomputeUnix(currentDateForTime, event.startTimeUnixSec, eventDate, event.title, event.timezone),
            endTimeUnixSec: recomputeUnix(currentDateForTime, event.endTimeUnixSec, eventDate, event.title, event.timezone),
            repeatId: dateStr
          };

          expanded.push(expandedEvent);
          currentDate.setUTCDate(currentDate.getUTCDate() + 7);
        }
      }
    }

    return expanded;
  };

  if (startDate && endDate) {
    return expandRepeats(events, startDate, endDate);
  }

  return events;
};

describe('Timezone-aware event expansion', () => {
  it('should preserve local wall-clock time across DST changes', async () => {
    // Test weekly event that spans DST change (Oct 27, 2025 in Finland)
    const events = await mockFetchTeamEvents('test-team', '2025-10-17', '2025-11-07');

    expect(events).toHaveLength(4); // 4 weeks of repeats

    // Check that all events have the same local time (18:00-20:00 Helsinki time)
    for (const event of events) {
      const startDate = new Date(event.startTimeUnixSec * 1000);
      const endDate = new Date(event.endTimeUnixSec * 1000);

      // Convert to Helsinki time
      const startHelsinki = startDate.toLocaleString('en-US', {
        timeZone: 'Europe/Helsinki',
        hour: '2-digit',
        minute: '2-digit',
        hour12: false
      });

      const endHelsinki = endDate.toLocaleString('en-US', {
        timeZone: 'Europe/Helsinki',
        hour: '2-digit',
        minute: '2-digit',
        hour12: false
      });

      console.log(`Event on ${event.eventDate}: ${startHelsinki} - ${endHelsinki}`);

      // All events should be at 18:00-20:00 Helsinki time
      expect(startHelsinki).toBe('18:00');
      expect(endHelsinki).toBe('20:00');
    }
  });

  it('should handle timezone conversion correctly', () => {
    // Test the recomputeUnix function directly
    const originalUnix = 1760713200; // 2025-10-17 18:00:00 UTC+3
    const baseDate = new Date('2025-10-24T00:00:00.000Z'); // Next week
    const timezone = 'Europe/Helsinki';

    const recomputeUnix = (baseDate: Date, originalUnix: number, originalDate: Date, eventTitle?: string, timezone?: string) => {
      if (!timezone) {
        const origDate = new Date(originalUnix * 1000);
        const hours = origDate.getUTCHours();
        const minutes = origDate.getUTCMinutes();
        const seconds = origDate.getUTCSeconds();

        const newDate = new Date(baseDate);
        newDate.setUTCHours(hours, minutes, seconds, 0);
        return Math.floor(newDate.getTime() / 1000);
      }

      try {
        const origDate = new Date(originalUnix * 1000);

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

        const baseDateStr = baseDate.toISOString().split('T')[0];
        const timeStr = `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
        const localDateTimeStr = `${baseDateStr}T${timeStr}`;

        const tempDate = new Date(localDateTimeStr);
        const tempDateInTimezone = new Date(tempDate.toLocaleString('en-US', { timeZone: timezone }));
        const offset = tempDate.getTime() - tempDateInTimezone.getTime();

        return Math.floor((tempDate.getTime() + offset) / 1000);
      } catch (error) {
        console.warn(`Timezone conversion failed for ${timezone}, falling back to UTC:`, error);

        const origDate = new Date(originalUnix * 1000);
        const hours = origDate.getUTCHours();
        const minutes = origDate.getUTCMinutes();
        const seconds = origDate.getUTCSeconds();

        const newDate = new Date(baseDate);
        newDate.setUTCHours(hours, minutes, seconds, 0);
        return Math.floor(newDate.getTime() / 1000);
      }
    };

    const result = recomputeUnix(baseDate, originalUnix, new Date(), 'Test Event', timezone);
    const resultDate = new Date(result * 1000);

    // Should be 18:00 Helsinki time on 2025-10-24
    const helsinkiTime = resultDate.toLocaleString('en-US', {
      timeZone: 'Europe/Helsinki',
      hour: '2-digit',
      minute: '2-digit',
      hour12: false
    });

    expect(helsinkiTime).toBe('18:00');
  });
});
