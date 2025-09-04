import { z } from 'zod';
import { emailSchema, passwordSchema, nameSchema } from './common';

// User registration schema
export const registerSchema = z.object({
  email: emailSchema,
  password: passwordSchema,
  name: nameSchema
});

// User login schema
export const loginSchema = z.object({
  email: emailSchema,
  password: z.string().min(1, 'Password is required')
});

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
export type RegisterInput = z.infer<typeof registerSchema>;
export type LoginInput = z.infer<typeof loginSchema>;
export type UpdateProfileInput = z.infer<typeof updateProfileSchema>;
export type ChangePasswordInput = z.infer<typeof changePasswordSchema>;
