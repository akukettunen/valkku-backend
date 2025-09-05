import { z } from 'zod';
import { emailSchema, passwordSchema, nameSchema } from './common';

// Profile update schema
export const updateProfileSchema = z.object({
  name: nameSchema.optional(),
  email: emailSchema.optional()
}).refine(data => Object.keys(data).length > 0, {
  message: 'At least one field must be provided for update'
});

// Password change schema
export const changePasswordSchema = z.object({
  currentPassword: z.string().min(1, 'Current password is required'),
  newPassword: passwordSchema
});

// Export types for use in route handlers
export type UpdateProfileInput = z.infer<typeof updateProfileSchema>;
export type ChangePasswordInput = z.infer<typeof changePasswordSchema>;
