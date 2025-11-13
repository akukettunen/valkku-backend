import { z } from 'zod';

export const createFolderSchema = z.object({
  name: z.string().min(1, 'Name is required').max(255),
  folderType: z.enum(['plan_part', 'plan', 'file', 'folder']).default('folder'),
  position: z.number().int().min(0),
  teamId: z.string().length(21),
  parentId: z.number().int().positive().nullable().optional(),
});

export const updateFolderSchema = z.object({
  name: z.string().min(1).max(255).optional(),
  folderType: z.enum(['plan_part', 'plan', 'file', 'folder']).optional(),
  position: z.number().int().min(0).optional(),
  parentId: z.number().int().positive().nullable().optional(),
});

export const updateFolderPositionsSchema = z.object({
  positions: z.array(z.object({
    id: z.number().int().positive(),
    position: z.number().int().min(0)
  }))
});
