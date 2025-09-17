import { z } from 'zod';
import { nameSchema, emailSchema, normalRoleSchema, preferredLanguageSchema } from '@/schemas/common';

export type ROLES = 'owner' | 'admin' | 'coach' | 'athlete' | 'guardian';
// ROLES exclude owner
export type NORMAL_ROLES = 'admin' | 'coach' | 'athlete' | 'guardian';

export const createTeamSchema = z.object({
  name: nameSchema
});

export const guardianSchema = z.object({
  userId: z.string().optional(),
  firstName: nameSchema.optional(),
  lastName: nameSchema.optional(),
  preferredLanguage: preferredLanguageSchema.optional(),
  email: emailSchema.optional()
}).refine(data => data.userId || (data.firstName && data.lastName && data.email && data.preferredLanguage), {
  message: "Either userId or all other fields must be provided",
  path: []
});

export const inviteUserSchema = z.object({
  firstName: nameSchema,
  lastName: nameSchema,
  email: emailSchema,
  preferredLanguage: preferredLanguageSchema,
  role: normalRoleSchema,
  guardianOf: z.string().optional(),
  guardians: z.array(guardianSchema).max(5).optional()
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
  const emails = data.guardians.map(g => g.email).filter(Boolean);
  const userIds = data.guardians.map(g => g.userId).filter(Boolean);
  const uniqueEmails = new Set(emails);
  const uniqueUserIds = new Set(userIds);
  return uniqueEmails.size === emails.length && uniqueUserIds.size === userIds.length;
}, {
  message: "All guardian emails or userIds must be unique.",
  path: ['guardians']
});