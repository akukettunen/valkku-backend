import { Router, Request, Response } from "express";
import { signupSchema, loginSchema, changePasswordSchema } from "@/schemas/auth";
import { validate } from "@/middleware/validation";
import { createUser, getUserByEmail, getUserById, revokeSession, updateUserPassword } from "@/db/user";
import { User } from "@/types/user";
import { getPublicUserById } from "@/utils/userHelper";
const router: Router = Router();
import { AppError } from "@/middleware/errors";
import { hashPassword } from "@/utils/authHelper";
import { verifyPassword } from "@/utils/authHelper";
import { generateAccessToken, generateRefreshToken, hashRefreshToken } from "@/utils/tokenHelper";
import { requireSignedIn } from "@/middleware/auth";
import {
  findSessionByHash,
  createSession,
  linkReplacedSession
} from '@/db/session'
import { createId } from '@/utils/userHelper';

router.post('/signin', validate(loginSchema), async (req: Request, res: Response) => {
  const { email, password, inviteToken } = req.body;

  const [ user ] = await getUserByEmail(email) as User[];

  const candidateHash = user?.passwordHash ?? '$argon2id$v=19$m=65536,t=3,p=1$AAAAAAAAAAAAAAAAAAAAAA$AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA'
  const isPasswordValid = await verifyPassword(candidateHash, password);

  if(!user || !isPasswordValid) {
    throw new AppError('Password or email is wrong', 401, 'invalid_login_credentials');
  }

  const publicUser = await getPublicUserById(user.id, null);
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

  res.set('Cache-Control', 'no-store')
  res.set('Pragma', 'no-cache')
  res.set('Expires', '0')

  res.cookie("rtid", token, {
    httpOnly: true,
    secure: process.env['NODE_ENV'] !== 'development',               // true in prod (HTTPS)
    sameSite: "lax",
    path: "/api/auth/refresh",      // critical: only sent to refresh endpoint
    maxAge: parseInt(process.env["REFRESH_TOKEN_VALID_DAYS"] ?? '90') * 24 * 60 * 60 * 1000 // 90 days
  })

  return res.status(200).json({
    success: true,
    message: 'Login successful',
    code: 'login_successful',
    data: {
      token: accessToken,
      user: publicUser
    }
  })
});

router.post('/signup', validate(signupSchema), async (req: Request, res: Response) => {
  const { firstName, lastName, email, password, repeatPassword, preferredLanguage } = req.body;

  const [ existingUser ] = await getUserByEmail(email) as User[];
  if(existingUser) {
    throw new AppError('User already exists', 400, 'user_already_exists');
  }

  if(password !== repeatPassword) {
    throw new AppError('Passwords do not match', 400, 'passwords_do_not_match');
  }

  const passwordHash = await hashPassword(password);
  await createUser({ id: createId(), email, passwordHash, firstName, lastName, preferredLanguage, forcePasswordChange: false }) as any;

  return res.status(201).json({
    success: true,
    message: 'Signup successful',
    code: 'signup_successful'
  });
});

router.post('/refresh', async (req, res) => {
  const cookie = req.cookies?.rtid

  if (!cookie) {
    throw new AppError('Missing refresh token', 401, 'missing_refresh')
  }

  const hash = hashRefreshToken(cookie)
  const session = await findSessionByHash(hash)

  if (!session) {
    throw new AppError('Invalid refresh token', 401, 'invalid_refresh')
  }
  if (session.revokedAt) {
    throw new AppError('Refresh token revoked', 401, 'refresh_revoked')
  }
  if (new Date(session.expiresAt) < new Date()) {
    throw new AppError('Refresh token expired', 401, 'refresh_expired')
  }

  // Rotate
  const user = await getPublicUserById(session.userId, null)
  if (!user) throw new AppError('User not found', 404, 'user_not_found')

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

  // Set rotated cookie
  res.cookie('rtid', newToken, {
    httpOnly: true,
    secure: process.env['NODE_ENV'] !== 'development',
    sameSite: 'lax',           // use 'none' + secure:true if cross-site
    path: '/api/auth/refresh',
    maxAge: Math.max(0, new Date(expiresAt).getTime() - Date.now())
  })

  res.set('Cache-Control', 'no-store')
  res.json({ token: accessToken })
});

router.post("/logout", async (req: Request, res: Response) => {
  const cookie = req.cookies['rtid']

  // Clear the refresh cookie
  res.clearCookie("rtid", {
    httpOnly: true,
    secure: process.env['NODE_ENV'] !== "development",
    sameSite: "lax",
    path: "/api/auth/refresh" // 👈 must match the Path you used when setting
  })

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

export default router;