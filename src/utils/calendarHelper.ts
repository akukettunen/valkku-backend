/* eslint-disable no-control-regex */

export interface EventInput {
  id: number | string | null;
  title: string | null;
  teamId: string | null;
  type: string | null;
  status: string | null;
  createdById?: string | null;

  notes?: string | null;
  ownNotes?: string | null;
  coachesNotes?: string | null;

  eventDate?: string | null;              // original date/time from DB (may be ISO)
  eventDateYmd?: string | null;           // injected 'YYYY-MM-DD' from DB layer
  startTimeUnixSec?: number | null;
  endTimeUnixSec?: number | null;
  durationInMinutes?: number | null;

  repeats?: string | null;                // e.g., "daily"
  repeatsOn?: string | null;              // 7-char mask "1100000" (Mon..Sun)
  repeatsUntilUnixSec?: number | null;

  locationId?: number | string | null;

  createdAt?: string | null;
  updatedAt?: string | null;

  forAllAthletes?: number | boolean | null;

  // Rich location fields
  name?: string | null;
  formattedAddress?: string | null;
  addressLine1?: string | null;
  addressLine2?: string | null;
  city?: string | null;
  state?: string | null;
  zip?: string | null;
  country?: string | null;

  lat?: number | string | null;
  lon?: number | string | null;

  provider?: string | null;
  providerPlaceId?: string | null;
}

export interface EventsPayload {
  data: EventInput[];
}

import type { LOCALES } from "@/types/general";
import { localizeEventType } from "@/locales/roles";
import { tCal } from "@/locales/calendar";

export interface IcsOptions {
  calendarName?: string;
  calendarDesc?: string;
  prodId?: string;                 // e.g. "-//YourOrg//Team Calendar//EN"
  domain?: string;                 // used in UIDs
  baseEventUrl?: string;           // e.g. "https://yourapp.example.com/events"
  defaultDurationMinutes?: number; // fallback when no end time & no duration
  includeDefaultAlarm?: false | number; // minutes before start, e.g. 30
  locale?: LOCALES;                // 'en' | 'fi' (defaults to 'en')
  /**
   * Offset, in minutes, used ONLY for determining the calendar DATE of "all-day"
   * self-training items (durationInMinutes present, no explicit start/end).
   * Example for Europe/Helsinki (UTC+2/UTC+3): 120 or 180 depending on DST.
   * If you always want local dates for Helsinki, set 180 (summer) or compute dynamically.
   */
  allDayLocalOffsetMinutes?: number;
}

/**
 * Convert your event JSON (array or {data: [...]}) to an iCalendar (ICS) feed string.
 * - Timed events: UTC DTSTART/DTEND (Z-suffixed).
 * - "Anytime" events: when durationInMinutes is set and both start/end are missing,
 *   emit all-day DATE values so clients pin them to the top of the day.
 * - Adds LOCATION (name/address), GEO, Apple structured location when coords exist.
 * - Handles RRULE from `repeats`, `repeatsOn`, `repeatsUntilUnixSec`.
 * - Stable UID even if `id` is null (FNV-1a hash).
 */
export function eventsToICS(input: EventInput[] | EventsPayload | null | undefined, options: IcsOptions = {}): string {
  const { locale = 'en' } = options;
  const {
    calendarName = tCal('defaultCalendarName', locale),
    calendarDesc = tCal('defaultCalendarDesc', locale),
    prodId = "-//YourOrg//Team Calendar//EN",
    domain = "https://valkku.com",
    baseEventUrl,
    defaultDurationMinutes = 60,
    includeDefaultAlarm = false,
    allDayLocalOffsetMinutes = 0,
  } = options;

  const events: EventInput[] = Array.isArray(input)
    ? input
    : (input && (input as EventsPayload).data) || [];

  const DAY_CODES = ["MO", "TU", "WE", "TH", "FR", "SA", "SU"] as const;

  // ---------- helpers -------------------------------------------------------

  const isFiniteNumber = (v: unknown): v is number =>
    typeof v === "number" && Number.isFinite(v);

  const toNumberOrNull = (v: unknown): number | null => {
    if (v == null) return null;
    if (typeof v === "number") return Number.isFinite(v) ? v : null;
    if (typeof v === "string" && v.trim() !== "" && !Number.isNaN(Number(v))) {
      return Number(v);
    }
    return null;
  };

  const foldLine = (line: string): string => {
    if (line.length <= 75) return line;
    const chunks: string[] = [];
    for (let i = 0; i < line.length; i += 75) {
      chunks.push(i === 0 ? line.slice(i, i + 75) : " " + line.slice(i, i + 75));
    }
    return chunks.join("\r\n");
  };

  const esc = (s: unknown): string =>
    String(s ?? "")
      .replace(/\\/g, "\\\\")
      .replace(/;/g, "\\;")
      .replace(/,/g, "\\,")
      .replace(/\r?\n/g, "\\n");

  const pad2 = (n: number): string => String(n).padStart(2, "0");

  const fmtDateUTC = (d: Date): string =>
    `${d.getUTCFullYear()}${pad2(d.getUTCMonth() + 1)}${pad2(d.getUTCDate())}` +
    `T${pad2(d.getUTCHours())}${pad2(d.getUTCMinutes())}${pad2(d.getUTCSeconds())}Z`;

  const fmtDateOnly = (d: Date): string =>
    `${d.getUTCFullYear()}${pad2(d.getUTCMonth() + 1)}${pad2(d.getUTCDate())}`;

  const fromUnix = (sec: number): Date => new Date(sec * 1000);

  const mapStatus = (status: string | null | undefined): "CONFIRMED" | "CANCELLED" | "TENTATIVE" => {
    switch ((status || "").toLowerCase()) {
      case "cancelled": return "CANCELLED";
      case "tentative": return "TENTATIVE";
      default: return "CONFIRMED";
    }
  };

  const localizedType = (type: string | null | undefined): string => localizeEventType(type, locale);

  // FNV-1a for stable UID seeds when id is null
  const fnv1a = (str: string): string => {
    let h = 0x811c9dc5 >>> 0;
    for (let i = 0; i < str.length; i++) {
      h ^= str.charCodeAt(i);
      h = Math.imul(h, 0x01000193) >>> 0;
    }
    return h.toString(36);
  };

  const eventUID = (ev: EventInput, domainName: string): string => {
    if (ev.id != null && ev.id !== "") return `${String(ev.id)}@${domainName}`;
    const seed = [
      ev.teamId ?? "",
      ev.title ?? "",
      isFiniteNumber(ev.startTimeUnixSec) ? String(ev.startTimeUnixSec) : "",
      ev.eventDate ?? "",
      ev.type ?? "",
    ].join("|");
    return `anon-${fnv1a(seed)}@${domainName}`;
  };

  const sequenceFromUpdatedAt = (updatedAt: string | null | undefined): number => {
    if (!updatedAt) return 0;
    const t = new Date(updatedAt).getTime();
    return Number.isFinite(t) ? Math.max(0, Math.floor(t / 1000)) : 0;
  };

  const buildRRule = (ev: EventInput): string | null => {
    const { repeats, repeatsOn, repeatsUntilUnixSec } = ev;
    if (!repeats) return null;

    const parts: string[] = [];
    if (String(repeats).toLowerCase() === "daily") {
      if (typeof repeatsOn === "string" && repeatsOn.length === 7) {
        const byday = [...repeatsOn]
          .map((c, i) => (c === "1" ? DAY_CODES[i] : null))
          .filter(Boolean)
          .join(",");
        if (byday) {
          parts.push("FREQ=WEEKLY");
          parts.push(`BYDAY=${byday}`);
        } else {
          parts.push("FREQ=DAILY");
        }
      } else {
        parts.push("FREQ=DAILY");
      }
    } else {
      parts.push(`FREQ=${String(repeats).toUpperCase()}`);
    }

    if (isFiniteNumber(repeatsUntilUnixSec!)) {
      parts.push(`UNTIL=${fmtDateUTC(fromUnix(repeatsUntilUnixSec!))}`);
    }

    return parts.length ? `RRULE:${parts.join(";")}` : null;
  };

  const buildDescription = (ev: EventInput, coachesNotes: boolean = false, ownNotes: boolean = false): string => {
    const lines: string[] = [];
    if (ev.notes) lines.push(`${tCal('notes', locale)}: ${ev.notes}`);
    if (coachesNotes && ev.coachesNotes) lines.push(`${tCal('coaches', locale)}: ${ev.coachesNotes}`);
    if (ownNotes && ev.ownNotes) lines.push(`${tCal('own', locale)}: ${ev.ownNotes}`);
    lines.push(`${tCal('type', locale)}: ${localizedType(ev.type || undefined)}`);
    if (baseEventUrl) lines.push(`${tCal('link', locale)}: ${baseEventUrl.replace(/\/+$/, "")}/${ev.id ?? ""}`);
    return esc(lines.join("\n"));
  };

  const hasCoords = (ev: EventInput): ev is EventInput & { lat: number | string; lon: number | string } =>
    ev.lat != null && ev.lon != null && toNumberOrNull(ev.lat) != null && toNumberOrNull(ev.lon) != null;

  const buildLocationLines = (ev: EventInput): string[] => {
    const out: string[] = [];

    const parts: string[] = [];
    if (ev.name) parts.push(ev.name);
    if (ev.formattedAddress) {
      parts.push(ev.formattedAddress);
    } else {
      const cityZip = ev.zip && ev.city ? `${ev.zip} ${ev.city}` : ev.city;
      const addrBits = [ev.addressLine1, ev.addressLine2, cityZip, ev.state, ev.country].filter(Boolean);
      if (addrBits.length) parts.push(addrBits.join(", "));
    }
    const humanLoc = parts.join(" — ");
    if (humanLoc) out.push(`LOCATION:${esc(humanLoc)}`);

    if (hasCoords(ev)) {
      const lat = toNumberOrNull(ev.lat)!;
      const lon = toNumberOrNull(ev.lon)!;
      out.push(`GEO:${lat};${lon}`);

      const title = esc(ev.name || ev.formattedAddress || "Location");
      const geoUri = `geo:${lat},${lon}`;
      out.push(
        `X-APPLE-STRUCTURED-LOCATION;VALUE=URI;X-ADDRESS=${esc(ev.formattedAddress || "")};` +
        `X-APPLE-RADIUS=100;X-TITLE=${title}:${esc(geoUri)}`
      );
    }

    return out;
  };

  // Compute DATE for all-day using optional local offset
  const deriveAllDayDates = (base: Date): { startDate: string; endDate: string } => {
    // For timezone-agnostic behavior, use the base date as-is for all-day events
    // This ensures consistent behavior regardless of server timezone
    const ymd = fmtDateOnly(base);
    // Add one day for non-inclusive DTEND
    const next = new Date(Date.UTC(base.getUTCFullYear(), base.getUTCMonth(), base.getUTCDate() + 1));
    const ymdNext = fmtDateOnly(next);
    return { startDate: ymd, endDate: ymdNext };
  };

  const eventToVEvent = (ev: EventInput): string | null => {
    const hasExplicitStart = isFiniteNumber(ev.startTimeUnixSec!);
    const hasExplicitEnd = isFiniteNumber(ev.endTimeUnixSec!);
    const hasDuration = isFiniteNumber(ev.durationInMinutes!);

    // All-day rule: duration provided, but no explicit start/end => all-day
    const shouldBeAllDay = !!hasDuration && !hasExplicitStart && !hasExplicitEnd;

    // Base datetime from which we derive either timed or all-day date
    let baseStart: Date | null = null;
    if (hasExplicitStart) {
      baseStart = fromUnix(ev.startTimeUnixSec!);
    } else if (ev.eventDate || ev.eventDateYmd) {
      // Parse eventDate - extract just the date part for all-day events
      let dateStr = ev.eventDateYmd || ev.eventDate!;
      if (typeof dateStr === 'string') {
        if (dateStr.includes('T')) {
          // Extract just the date part from ISO string (e.g., "2025-10-15T21:00:00.000Z" -> "2025-10-15")
          const datePart = dateStr.split('T')[0];
          if (datePart) dateStr = datePart;
        }
        // Always treat as UTC midnight for consistent all-day behavior
        dateStr = dateStr + 'T00:00:00Z';
      }
      const d = new Date(dateStr);
      if (!Number.isNaN(d.getTime())) baseStart = d;
    }

    // For all-day events with duration, we need at least an eventDate
    if (!baseStart && !shouldBeAllDay) return null;

    const lines: string[] = [];
    lines.push("BEGIN:VEVENT");
    lines.push(`UID:${esc(eventUID(ev, domain))}`);
    lines.push(`DTSTAMP:${fmtDateUTC(new Date())}`);
    lines.push(`SUMMARY:${esc(ev.title || "(untitled)")}`);
    lines.push(`CATEGORIES:${esc(localizedType(ev.type || undefined))}`);
    lines.push(`STATUS:${mapStatus(ev.status || undefined)}`);
    lines.push(`SEQUENCE:${sequenceFromUpdatedAt(ev.updatedAt || undefined)}`);

    if (shouldBeAllDay) {
      // All-day encoding (DATE values, end date is next day)
      // For all-day events, use eventDate if baseStart is not available
      let allDayBase: Date;
      if (baseStart) {
        allDayBase = baseStart;
      } else if (ev.eventDate || ev.eventDateYmd) {
        let dateStr = ev.eventDateYmd || ev.eventDate!;
        if (typeof dateStr === 'string') {
          if (dateStr.includes('T')) {
            // Extract just the date part from ISO string
            const datePart = dateStr.split('T')[0];
            if (datePart) dateStr = datePart;
          }
          // Always treat as UTC midnight for consistent all-day behavior
          dateStr = dateStr + 'T00:00:00Z';
        }
        allDayBase = new Date(dateStr);
      } else {
        allDayBase = new Date();
      }
      const { startDate, endDate } = deriveAllDayDates(allDayBase);
      lines.push(`DTSTART;VALUE=DATE:${startDate}`);
      lines.push(`DTEND;VALUE=DATE:${endDate}`);
      lines.push("X-MICROSOFT-CDO-ALLDAYEVENT:TRUE");
    } else {
      // Timed event: produce UTC DTSTART/DTEND
      if (!baseStart) return null; // Timed events need a start time
      let dtEnd: Date | null = null;
      if (hasExplicitEnd) {
        dtEnd = fromUnix(ev.endTimeUnixSec!);
      } else if (hasDuration) {
        dtEnd = new Date(baseStart.getTime() + (ev.durationInMinutes as number) * 60_000);
      } else {
        dtEnd = new Date(baseStart.getTime() + defaultDurationMinutes * 60_000);
      }
      lines.push(`DTSTART:${fmtDateUTC(baseStart)}`);
      if (dtEnd) lines.push(`DTEND:${fmtDateUTC(dtEnd)}`);
    }

    // Location-related fields
    buildLocationLines(ev).forEach((l) => lines.push(l));

    const desc = buildDescription(ev);
    if (desc) lines.push(`DESCRIPTION:${desc}`);

    if (baseEventUrl) {
      lines.push(`URL:${esc(`${baseEventUrl.replace(/\/+$/, "")}/${ev.id ?? ""}`)}`);
    }

    const rrule = buildRRule(ev);
    if (rrule) lines.push(rrule);

    if (includeDefaultAlarm && Number.isFinite(includeDefaultAlarm)) {
      const mins = Math.max(0, Math.trunc(includeDefaultAlarm as number));
      lines.push("BEGIN:VALARM");
      lines.push("ACTION:DISPLAY");
      lines.push(`TRIGGER:-PT${mins}M`);
      lines.push(`DESCRIPTION:${esc(ev.title || tCal('reminder', locale))}`);
      lines.push("END:VALARM");
    }

    lines.push("END:VEVENT");
    return lines.map(foldLine).join("\r\n");
  };

  // ---------- Build VCALENDAR -----------------------------------------------

  const cal: string[] = [];
  cal.push("BEGIN:VCALENDAR");
  cal.push("VERSION:2.0");
  cal.push(`PRODID:${prodId}`);
  cal.push("CALSCALE:GREGORIAN");
  cal.push("METHOD:PUBLISH");
  cal.push(`X-WR-CALNAME:${esc(calendarName)}`);
  cal.push(`X-WR-CALDESC:${esc(calendarDesc)}`);
  cal.push("X-PUBLISHED-TTL:PT1H");

  for (const ev of events) {
    const vevent = eventToVEvent(ev);
    if (vevent) {
      cal.push(vevent);
      console.log(`✅ Included event: ${ev.title} (${ev.type})`);
    } else {
      console.log(`❌ Excluded event: ${ev.title} (${ev.type}) - no valid time data`);
    }
  }

  cal.push("END:VCALENDAR");
  return cal.join("\r\n") + "\r\n";
}

/* -------------------- Usage --------------------

const ics = eventsToICS(YOUR_EVENTS_ARRAY, {
  calendarName: "My Team",
  calendarDesc: "Public team schedule",
  prodId: "-//MyOrg//Team Calendar//EN",
  domain: "myteam.example",
  baseEventUrl: "https://myapp.example.com/events",
  includeDefaultAlarm: 30,
  // If your “anytime” items should belong to the local Helsinki day:
  allDayLocalOffsetMinutes: 180, // or 120 in winter, or compute per-date from tz
});

-------------------------------------------------- */
