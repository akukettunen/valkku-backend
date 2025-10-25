import z from "zod";

export const createEventSchema = z.object({
  title: z.string(),
  type: z.string(),
  eventDate: z.string(),
  notes: z.string().nullable().optional(),
  coachesNotes: z.string().nullable().optional(),
  ownNotes: z.string().nullable().optional(),
  locationId: z.number().nullable().optional(),
  startTimeUnixSec: z.number().nullable().optional(),
  endTimeUnixSec: z.number().nullable().optional(),
  durationInMinutes: z.number().positive().nullable().optional(),
  timezone: z.string().optional().default('Europe/Helsinki'), // IANA timezone identifier
  repeats: z.enum(['daily', 'weekly', 'monthly']).optional(),
  repeatsOn: z.string().nullable().optional(),
  repeatsUntilUnixSec: z.number().optional().nullable(),
  status: z.string().optional().nullable()
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

  if (data.repeats === 'daily' && (data.repeatsOn == null || data.repeatsOn === '')) {
    ctx.addIssue({ code: z.ZodIssueCode.custom, message: 'repeatsOn required for weekly repeats', path: ['repeatsOn'] });
  }
})

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