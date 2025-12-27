import { z } from 'zod'

export const createEventSchema = z.object({
  title: z.string().max(400),
  type: z.enum(['practise', 'match', 'meeting', 'self_training', 'other_event', 'mental']),
  eventDate: z.string(), // Date in YYYY-MM-DD format
  notes: z.string().max(1000).nullable().optional(),
  coachesNotes: z.string().max(1000).nullable().optional(),
  ownNotes: z.string().max(1000).nullable().optional(),
  locationId: z.number().nullable().optional(),
  startTimeUnixSec: z.number().nullable().optional(),
  endTimeUnixSec: z.number().nullable().optional(),
  durationInMinutes: z.number().positive().nullable().optional(),
  timezone: z.string().max(50).optional().default('Europe/Helsinki'), // IANA timezone identifier
  repeats: z.enum(['weekly']).nullable().optional(), // Only weekly supported for now
  repeatsOn: z.string().max(7).nullable().optional(),
  repeatsUntilUnixSec: z.number().nullable().optional(),
  status: z.enum(['draft', 'published', 'archived']).optional().default('published'),
  planId: z.number().nullable().optional(),
  baseEventId: z.number().nullable().optional(),
  forAllAthletes: z.boolean().optional().default(true),
  forAllStaff: z.boolean().optional().default(true),
  registrationRequired: z.boolean().optional().default(true),
  userIds: z.array(z.string()).optional(),
  defaultIn: z.boolean().optional(),
  staffDefaultIn: z.boolean().optional(),
}).superRefine((data, ctx) => {
  const hasStart = data.startTimeUnixSec != null;
  const hasEnd = data.endTimeUnixSec != null;
  const hasDuration = data.durationInMinutes != null;

  if (hasDuration && (hasStart || hasEnd)) {
    ctx.addIssue({ code: z.ZodIssueCode.custom, message: 'Provide either durationInMinutes or start/end times, not both', path: ['durationInMinutes'] });
  }

  if (!hasDuration) {
    if (!hasStart || !hasEnd) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, message: 'startTimeUnixSec and endTimeUnixSec are required when durationInMinutes is not set', path: ['startTimeUnixSec'] });
      ctx.addIssue({ code: z.ZodIssueCode.custom, message: 'startTimeUnixSec and endTimeUnixSec are required when durationInMinutes is not set', path: ['endTimeUnixSec'] });
    } else {
      if (!(data.startTimeUnixSec! < data.endTimeUnixSec!)) {
        ctx.addIssue({ code: z.ZodIssueCode.custom, message: 'Start time must be before end time', path: ['startTimeUnixSec'] });
      }
      if (data.startTimeUnixSec! < 0 || data.endTimeUnixSec! < 0) {
        ctx.addIssue({ code: z.ZodIssueCode.custom, message: 'Start time and end time must be greater than 0', path: ['startTimeUnixSec'] });
      }
    }
  }

  // If event repeats, repeatsUntilUnixSec is required
  if (data.repeats != null && data.repeatsUntilUnixSec == null) {
    ctx.addIssue({ code: z.ZodIssueCode.custom, message: 'repeatsUntilUnixSec is required when repeats is set', path: ['repeatsUntilUnixSec'] });
  }
})

export const createAthleteEventSchema = z.object({
  title: z.string().max(400),
  type: z.enum(['self_training', 'mental']).default('self_training'),
  eventDate: z.string(),
  durationInMinutes: z.number().positive(),
  notes: z.string().max(1000).nullable().optional(),
  timezone: z.string().max(50).optional().default('Europe/Helsinki'),
}).strict();

export const createEventPlanPartSchema = z.object({
  durationInMinutes: z.number().optional(),
  typeId: z.number().optional(),
});

export const createEventPlanPartTypeSchema = z.object({
  titleObject: z.object(),
  color: z.string(),
  scope: z.enum(['global', 'club', 'team', 'user']),
  teamId: z.string().optional(),
  userId: z.string().optional(),
  position: z.number().optional(),
});

export const updateAttendanceSchema = z.object({
  repeatId: z.string().optional(), // For recurring events
  attends: z.boolean().nullable() // null to delete attendance
});