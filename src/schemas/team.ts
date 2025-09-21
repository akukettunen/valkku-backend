import { z } from 'zod';
import { nameSchema, emailSchema, normalRoleSchema, preferredLanguageSchema } from '@/schemas/common';

export type ROLES = 'owner' | 'admin' | 'coach' | 'athlete' | 'guardian';
// ROLES exclude owner
export type NORMAL_ROLES = 'admin' | 'coach' | 'athlete' | 'guardian';

export const createTeamSchema = z.object({
  name: nameSchema
});

const guardianSchema = z.object({
  email: emailSchema.optional(),
  userId: z.string().optional(),
  firstName: z.string().optional(),
  lastName: z.string().optional(),
  preferredLanguage: preferredLanguageSchema
})
.refine(data => {
  return data.email || data.userId;
}, {
  message: "Either email or userId must be provided.",
  path: ['email', 'userId']
});

export const inviteUserSchema = z.object({
  email: emailSchema,
  preferredLanguage: preferredLanguageSchema,
  role: normalRoleSchema,
  firstName: z.string().optional(),
  lastName: z.string().optional(),
  guardianOf: z.string().optional(),
  guardians: z.array(guardianSchema).max(6).optional()
})
.refine(data => {
  return data.role !== 'guardian' || data.guardianOf
}, {
  message: "Guardian email or userId cannot be the same as the email.",
  path: ['guardians']
})
.refine(data => !data.guardians || data.role === 'athlete', {
  message: "If guardians are provided, role must be 'athlete'.",
  path: ['role']
})
.refine(data => !data.guardianOf || data.role === 'guardian', {
  message: "If guardianOf is provided, role must be 'guardian'.",
  path: ['role']
})
.refine(data => {
  if (!data.guardians) return true;
  const emails = data.guardians.map(g => g).filter(Boolean);
  const uniqueEmails = new Set(emails);
  return uniqueEmails.size === emails.length;
}, {
  message: "All guardian emails or userIds must be unique.",
  path: ['guardians']
});