import { z } from 'zod';

export const createPeriodSchema = z.object({
  name: z.string().min(1, 'Period name is required').max(255),
  description: z.string().max(255).optional().nullable(),
  startDate: z.iso.date('Start date must be a valid datetime'),
  endDate: z.iso.date('End date must be a valid datetime'),
  color: z.string().regex(/^#[0-9A-F]{6}$/i, 'Color must be a valid hex color').optional(),
}).refine((data) => {
  const start = new Date(data.startDate);
  const end = new Date(data.endDate);
  return end > start;
}, {
  message: 'End date must be after start date',
  path: ['endDate'],
});

export const updatePeriodSchema = z.object({
  name: z.string().min(1, 'Period name is required').max(255).optional(),
  description: z.string().max(255).optional().nullable(),
  startDate: z.iso.date('Start date must be a valid datetime'),
  endDate: z.iso.date('End date must be a valid datetime'),
  color: z.string().regex(/^#[0-9A-F]{6}$/i, 'Color must be a valid hex color').optional(),
}).refine((data) => {
  if (data.startDate && data.endDate) {
    const start = new Date(data.startDate);
    const end = new Date(data.endDate);
    return end > start;
  }
  return true;
}, {
  message: 'End date must be after start date',
  path: ['endDate'],
});
