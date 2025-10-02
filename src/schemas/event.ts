import z from "zod";

export const createEventSchema = z.object({
  title: z.string(),
  notes: z.string().optional(),
  coachesNotes: z.string().optional(),
  ownNotes: z.string().optional(),
  locationId: z.number().optional(),
  startTimeUnixSec: z.number(),
  endTimeUnixSec: z.number(),
  repeats: z.enum(['daily', 'weekly', 'monthly']).optional(),
  repeatsOn: z.string().optional(),
  repeatsUntilDate: z.string().optional(),
}).refine(data => {
  return data.startTimeUnixSec < data.endTimeUnixSec;
}, {
  message: 'Start time must be before end time',
  path: ['startTimeUnixSec', 'endTimeUnixSec']
}).refine(data => {
  return data.startTimeUnixSec >= 0 && data.endTimeUnixSec >= 0;
}, {
  message: 'Start time and end time must be greater than 0',
  path: ['startTimeUnixSec', 'endTimeUnixSec']
}).refine(data => {
  return data.repeats !== 'daily' || data.repeatsOn !== undefined;
}, {
  message: 'Repeats on must be provided if repeats is daily',
  path: ['repeats', 'repeatsOn']
}).refine(data => {
  return !data.repeats || data.repeatsUntilDate !== undefined;
}, {
  message: 'Repeats until date must be provided if repeats',
  path: ['repeats', 'repeatsUntilDate']
})

export const createEventPlanPartTypeSchema = z.object({
  titleObject: z.object(),
  color: z.string(),
  scope: z.enum(['global', 'club', 'team', 'user']),
  teamId: z.string().optional(),
  userId: z.string().optional(),
});

export const createEventPlanPartSchema = z.object({
  durationInMinutes: z.number().optional(),
  typeId: z.number().optional(),
});