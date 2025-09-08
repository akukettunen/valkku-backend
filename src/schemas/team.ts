import { z } from 'zod';
import { nameSchema } from './common';

export type ROLES = 'owner' | 'admin' | 'coach' | 'athlete' | 'guardian';

export const createTeamSchema = z.object({
  name: nameSchema
});