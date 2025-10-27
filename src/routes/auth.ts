import { Router, Request, Response } from "express";
import { signupSchema, loginSchema, changePasswordSchema, requestPasswordResetSchema, verifyPasswordResetSchema, confirmPasswordResetSchema } from "@/schemas/auth";
import { validate } from "@/middleware/validation";
import { createUser, getUserByEmail, getUserById, updateUserPassword, getUserTeams } from "@/db/user";
import { User } from "@/types/user";
import { getPublicUserSelfById } from "@/utils/userHelper";
const router: Router = Router();
import { AppError } from "@/middleware/errors";
import { hashPassword } from "@/utils/authHelper";
import { verifyPassword } from "@/utils/authHelper";
import { generateAccessToken, generateRefreshToken, hashRefreshToken, hashPasswordResetToken, attachRefreshTokenCookie, clearRefreshTokenCookie } from "@/utils/tokenHelper";
import { requireSignedIn } from "@/middleware/auth";
import {
  findSessionByHash,
  createSession,
  linkReplacedSession
} from '@/db/session'
import { createId } from '@/utils/userHelper';
import { sendWelcomeEmail } from "@/utils/emailHelper";
import { sendPasswordResetEmail } from "@/utils/emailHelper";
import crypto from 'crypto';
import { createPasswordReset, findByTokenHash, markUsedById } from '@/db/passwordReset';
import { Transaction } from '@/db/index';
import { revokeAllUserSessions } from '@/db/session';

router.post('/signin', validate(loginSchema), async (req: Request, res: Response) => {
  const { email, password } = req.body;

  const [ user ] = await getUserByEmail(email);

  const candidateHash = user?.passwordHash ?? '$argon2id$v=19$m=65536,t=3,p=1$AAAAAAAAAAAAAAAAAAAAAA$AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA'
  const isPasswordValid = await verifyPassword(candidateHash, password);

  if(!user || !isPasswordValid) {
    throw new AppError('Password or email is wrong', 401, 'invalid_login_credentials');
  }

  const publicUser = await getPublicUserSelfById(user.id, null);
  if(!publicUser) {
    throw new AppError('Something went wrong', 500, 'something_went_wrong');
  }

  const accessToken = await generateAccessToken(publicUser)
  const { token, hash, jti, expiresAt } = await generateRefreshToken()

  await createSession({
    jti,
    userId: user.id,
    refreshHash: hash,
    expiresAt,
    ip: req.ip ?? null,
    userAgent: req.headers['user-agent'] ?? null
  })

  // Set refresh token as httpOnly cookie
  attachRefreshTokenCookie(res, token, expiresAt)

  return res.status(200).json({
    success: true,
    message: 'Login successful',
    code: 'login_successful',
    data: {
      token: accessToken,
      refreshToken: token, // we return this for the mobile app. frontend should not store this in localStorage
      refreshExpiresAt: expiresAt.toISOString(),
      user: publicUser
    }
  })
});

router.post('/signup', validate(signupSchema), async (req: Request, res: Response) => {
  const { firstName, lastName, email, password, repeatPassword, preferredLanguage } = req.body;

  const [ existingUser ] = await getUserByEmail(email);

  if(existingUser) {
    const userTeams = await getUserTeams(existingUser.id);
    let invited = userTeams.length > 0;
    userTeams.forEach(team => {
      if(team.status !== 'invited') {
        invited = false;
      }
    })

    if(!invited) throw new AppError('User already exists', 400, 'user_already_exists');
    else throw new AppError('User already invited', 400, 'user_already_invited');
  }

  if(password !== repeatPassword) {
    throw new AppError('Passwords do not match', 400, 'passwords_do_not_match');
  }

  const passwordHash = await hashPassword(password);
  await createUser({ id: createId(), email, passwordHash, firstName, lastName, preferredLanguage, forcePasswordChange: false, emailConfirmed: false }) as any;

  await sendWelcomeEmail(email, firstName, preferredLanguage);

  return res.status(201).json({
    success: true,
    message: 'Signup successful',
    code: 'signup_successful'
  });
});

router.post('/refresh', async (req, res) => {
  const presented = (req.cookies?.refreshToken as string | undefined)
    || (req.body?.refreshToken as string | undefined)
    || (req.headers['x-refresh-token'] as string | undefined);

  if (!presented) {
    console.log('❌ [REFRESH] Missing refresh token in cookie, body or x-refresh-token header');
    throw new AppError('Missing refresh token', 401, 'missing_refresh')
  }

  console.log('🔍 [REFRESH] Refresh token provided, hashing token');
  const hash = hashRefreshToken(presented)
  console.log('🔍 [REFRESH] Token hash created');

  const session = await findSessionByHash(hash)
  console.log('🔍 [REFRESH] Session lookup result:', !!session);
  console.log('🔍 [REFRESH] Session details:', session ? {
    jti: session.jti,
    userId: session.userId,
    expiresAt: session.expiresAt,
    revokedAt: session.revokedAt,
    ip: session.ip,
    userAgent: session.userAgent
  } : null);

  if (!session) {
    console.log('❌ [REFRESH] Invalid refresh token - session not found');
    throw new AppError('Invalid refresh token', 401, 'invalid_refresh')
  }
  if (session.revokedAt) {
    console.log('❌ [REFRESH] Refresh token revoked at:', session.revokedAt);
    throw new AppError('Refresh token revoked', 401, 'refresh_revoked')
  }

  const now = new Date();
  const sessionExpiresAt = new Date(session.expiresAt);

  if (sessionExpiresAt < now) {
    throw new AppError('Refresh token expired', 401, 'refresh_expired')
  }

  // Rotate
  const user = await getPublicUserSelfById(session.userId, null)

  if (!user) {
    console.log('❌ [REFRESH] User not found in database');
    throw new AppError('User not found', 404, 'user_not_found')
  }

  const accessToken = await generateAccessToken(user)

  const { token: newToken, hash: newHash, jti: newJti, expiresAt } = await generateRefreshToken()

  await createSession({
    jti: newJti,
    userId: user.id,
    refreshHash: newHash,
    expiresAt,
    ip: req.ip ?? null,
    userAgent: req.headers['user-agent'] ?? null
  })

  await linkReplacedSession(session.jti, newJti)

  // Set new refresh token as httpOnly cookie
  attachRefreshTokenCookie(res, newToken, expiresAt)

  res.set('Cache-Control', 'no-store')
  res.json({
    token: accessToken,
    refreshToken: newToken, // we return this for the mobile app. frontend should not store this in localStorage
    refreshExpiresAt: expiresAt.toISOString()
  })
});

router.post("/logout", async (req: Request, res: Response) => {
  // Clear the refresh token cookie
  clearRefreshTokenCookie(res)

  res.set("Cache-Control", "no-store")
  return res.status(204).end()
});

router.post("/change-password", requireSignedIn, validate(changePasswordSchema), async (req: Request, res: Response) => {
  const { currentPassword, newPassword } = req.body;
  const userId = req.user?.sub;

  if (!userId) {
    throw new AppError('User not authenticated', 401, 'unauthorized');
  }

  // Get the current user to verify current password
  const [user] = await getUserById(userId) as User[];
  if (!user) {
    throw new AppError('User not found', 404, 'user_not_found');
  }

  // Verify current password
  const isCurrentPasswordValid = await verifyPassword(user.passwordHash, currentPassword);
  if (!isCurrentPasswordValid) {
    throw new AppError('Current password is incorrect', 400, 'invalid_current_password');
  }

  // Hash the new password
  const newPasswordHash = await hashPassword(newPassword);

  // Update the user's password
  await updateUserPassword(userId, newPasswordHash);

  return res.status(200).json({
    success: true,
    message: 'Password changed successfully',
    code: 'password_changed_successfully'
  });
});

router.post('/password-reset/request', validate(requestPasswordResetSchema), async (req: Request, res: Response) => {
  const { email } = req.body as { email: string };

  const [user] = await getUserByEmail(email);

  if (user) {
    const rawToken = crypto.randomBytes(48).toString('base64url');
    const tokenHash = hashPasswordResetToken(rawToken);
    const ttlMinutes = parseInt(process.env['PASSWORD_RESET_TTL_MINUTES'] || '30', 10);
    const expiresAt = new Date(Date.now() + ttlMinutes * 60 * 1000);

    try {
      await createPasswordReset(user.id, tokenHash, expiresAt);
      await sendPasswordResetEmail(user.email, rawToken, user.firstName || undefined, (user.preferredLanguage as any) || 'en');
    } catch (e) {
      // swallow to avoid leaking existence or errors; log server-side
      console.error('password reset request failed', e);
    }
  }

  return res.status(200).json({
    success: true,
    message: 'If an account exists, a reset email has been sent',
    code: 'reset_email_sent'
  });
});

router.post('/password-reset/verify', validate(verifyPasswordResetSchema), async (req: Request, res: Response) => {
  const { token } = req.body as { token: string };
  const tokenHash = hashPasswordResetToken(token);
  const row = await findByTokenHash(tokenHash);

  if (!row || row.used) {
    throw new AppError('Invalid or expired token', 400, 'invalid_reset_token');
  }
  const now = Date.now();
  const expiresAt = new Date(row.expires_at).getTime();
  if (expiresAt < now) {
    throw new AppError('Invalid or expired token', 400, 'invalid_reset_token');
  }

  return res.status(200).json({ success: true, message: 'Token is valid', code: 'token_valid' });
});

// Confirm a password reset
router.post('/password-reset/confirm', validate(confirmPasswordResetSchema), async (req: Request, res: Response) => {
  const { token, newPassword } = req.body as { token: string; newPassword: string };

  const tokenHash = hashPasswordResetToken(token);
  const row = await findByTokenHash(tokenHash);

  if (!row || row.used) {
    throw new AppError('Invalid or expired token', 400, 'invalid_reset_token');
  }

  const now = Date.now();
  const expiresAt = new Date(row.expires_at).getTime();
  if (expiresAt < now) {
    throw new AppError('Invalid or expired token', 400, 'invalid_reset_token');
  }

  const newHash = await hashPassword(newPassword);

  // Transactionally set password and mark token used
  const tr = new Transaction();
  await tr.addTr(async (trx) => {
    await trx.query(`UPDATE users SET passwordHash = ? WHERE id = ?`, [newHash, row.user_id]);
    await trx.query(`UPDATE password_resets SET used = TRUE, used_at = NOW(3) WHERE id = ?`, [row.id]);
    return true;
  }).execute();

  // Revoke all sessions for this user after password change
  await revokeAllUserSessions(row.user_id);

  return res.status(200).json({ success: true, message: 'Password reset successful', code: 'password_reset_success' });
});

export default router;