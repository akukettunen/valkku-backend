import z from "zod";

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