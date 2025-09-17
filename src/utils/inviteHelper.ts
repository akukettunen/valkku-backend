import crypto from 'crypto';
import { query } from '@/db/index';
import { hashInviteToken } from '@/utils/tokenHelper';
import { createInvite } from '@/db/team';
import { getInvite } from '@/db/team';
import { PublicInvite } from '@/types/team';
import { NORMAL_ROLES } from '@/schemas/team';

export const inviteUser = async (userId: string, teamId: string, role: NORMAL_ROLES, invitedBy: string, guardianOf?: string) => {
  const token = crypto.randomBytes(64).toString("base64url")
  const tokenHash = hashInviteToken(token)
  await query('INSERT INTO email_token_raw_values_delete_in_prod (userId, rawTokenDanger) VALUES (?, ?, ?)', [userId, token])

  await createInvite({
    teamId,
    userId: userId,
    role,
    guardianOf: guardianOf ?? null,
    tokenHash,
    validUntil: new Date(Date.now() + 1000 * 60 * 60 * 24 * 10), // 10 days
    invitedBy
  });

  const [ invite ] = await getInvite(teamId, userId) as PublicInvite[];

  const publicInvite = {
    ...invite,
    tokenHash: null
  } as PublicInvite;

  // TODO: add email send to outbox table and implement email sending

  return publicInvite
}