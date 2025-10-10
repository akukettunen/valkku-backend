import { z } from 'zod';

export const createPlanPartItemTextSchema = z.object({
  text: z.string()
});

export const createPlanPartItemSchema = z.object({
  id: z.string(),
  eventId: z.number(),
  partId: z.string(),
  position: z.number(),
  type: z.enum(['audio', 'video', 'text', 'image', 'file', 'rest']),
  item: createPlanPartItemTextSchema
});

export const createPlanPartSchema = z.object({
  id: z.string(),
  durationInMinutes: z.number().nullable().optional(),
  typeId: z.number().nullable().optional(),
  position: z.number(),
  nodeType: z.enum(['part', 'item'])
});

export const createPlanSchema = z.object({
  title: z.string().nullable().optional(),
  description: z.string().nullable().optional(),
  teamId: z.string(),
  copyOfPlanId: z.number().nullable().optional(),
  scope: z.enum(['global', 'club', 'team', 'user']),
  eventId: z.number().nullable().optional(),
  parts: z.array(createPlanPartSchema).or(z.array(createPlanPartItemSchema))
});