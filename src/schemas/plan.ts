import { z } from 'zod';

export const createPlanPartItemTextSchema = z.object({
  text: z.string()
});

export const createPlanPartItemSchema = z.object({
  id: z.string(),
  partId: z.string(),
  position: z.number(),
  type: z.enum(['audio', 'video', 'text', 'image', 'file', 'rest']),
  nodeType: z.enum(['item']).optional(),
  item: createPlanPartItemTextSchema.optional(),
  __flash: z.boolean().optional()
});

export const createPlanPartSchema = z.object({
  id: z.string().length(21),
  title: z.string().nullable().optional(),
  description: z.string().nullable().optional(),
  durationInMinutes: z.number(),
  typeId: z.number(),
  position: z.number(),
  nodeType: z.enum(['part']).optional(),
  color: z.string().optional(),
  type: z.any().optional(),
  items: z.array(z.any()).optional(),
  __flash: z.boolean().optional()
});

export const updatePlanPartSchema = z.object({
  title: z.string().nullable().optional(),
  description: z.string().nullable().optional(),
  durationInMinutes: z.number().optional(),
  typeId: z.number().optional(),
  position: z.number().optional(),
  showInLibrary: z.boolean().optional(),
  items: z.array(createPlanPartItemSchema).optional()
});

export const createPlanSchema = z.object({
  id: z.number().nullable().optional(),
  title: z.string().nullable().optional(),
  description: z.string().nullable().optional(),
  teamId: z.string(),
  eventId: z.number().nullable().optional(),
  copyOfPlanId: z.number().nullable().optional(),
  scope: z.enum(['global', 'club', 'team', 'user']),
  showInLibrary: z.boolean().optional(),
  parts: z.array(createPlanPartSchema),
  items: z.array(createPlanPartItemSchema)
});