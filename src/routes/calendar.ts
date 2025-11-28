import { AppError } from '@/middleware/errors';
import { Router, Request, Response } from 'express';
import { query, sequelize } from '@/db/index';
import { getPublicUserSelfById } from '@/utils/userHelper';
import { ROLES } from '@/types/team';
import { requireSignedIn } from '@/middleware/auth';
import z from 'zod';
import { validate } from '@/middleware/validation';
import { createId } from '@/utils/userHelper';
import { getTeamEventsWithAttendanceCount } from '@/db/event';
import { EventInput, eventsToICS } from '@/utils/calendarHelper';
import { QueryTypes } from 'sequelize';

const router: Router = Router();

const createCalSubscriptionSchema = z.object({
  userId: z.string(),
  teamId: z.string(),
  role: z.enum(['owner', 'admin', 'coach', 'athlete', 'guardian']),
  guardianOfId: z.string().nullable()
});

router.post('/create-subscription', requireSignedIn, validate(createCalSubscriptionSchema), async (req: Request, res: Response) => {
  const { userId, teamId, role, guardianOfId } = req.body as { userId: string, teamId: string, role: ROLES, guardianOfId: string };

  const team = req.user?.teams.find(t => t.teamId === teamId);
  if(!team) {
    throw new AppError('Team not found', 404, 'something_went_wrong');
  }
  const hasRole = team.roles.some(r => r.role === role && r.guardianOf === guardianOfId);
  if(!hasRole) {
    throw new AppError('User does not have role in team', 400, 'something_went_wrong');
  }

  const token = createId(12) + '.ics';

  await query(`
    INSERT INTO cal_subscriptions (userId, teamId, role, guardianOfId, token) VALUES (?, ?, ?, ?, ?);
  `, [userId, teamId, role, guardianOfId, token]);

  const url = `${process.env['BACKEND_URL']}/api/calendar/${token}`;

  res.status(200).json({
    success: true,
    message: 'Subscription created',
    data: { url }
  });
});

router.get("/:token", async (req: Request, res: Response) => {
  const { token } = req.params as { token: string };

  if (!token) {
    throw new AppError("Missing subscription token", 400, "missing_token");
  }

  // 1. Find subscription
  const subscriptions = (await query(
    `SELECT
      *,
      teams.name as teamName
    FROM cal_subscriptions
    LEFT JOIN teams ON cal_subscriptions.teamId = teams.id
    WHERE token = ?`,
    [token]
  )) as Array<{ userId: string; teamId: string; role: string; guardianOfId: string; teamName: string }>;

  if (!subscriptions?.[0]?.userId) {
    throw new AppError("Invalid or expired subscription token", 404, "subscription_not_found");
  }

  const sub = subscriptions[0];

  // 1.1 Verify team membership
  const membership = (await query(
    `SELECT status FROM team_users WHERE userId = ? AND teamId = ?`,
    [sub.userId, sub.teamId]
  )) as Array<{ status: string }>;

  if (!membership?.[0]) {
    throw new AppError("User is no longer a member of this team", 403, "access_denied");
  }

  // 2. Verify user
  const user = await getPublicUserSelfById(sub.userId, null);
  let guardedData;
  if(sub.guardianOfId) {
    guardedData = await sequelize.query(
      `SELECT * FROM users WHERE id = ?`,
      {
        replacements: [sub.guardianOfId],
        type: QueryTypes.SELECT
      }
    ) as any[];
  }

  if (!user) {
    throw new AppError("User not found for subscription", 404, "user_not_found");
  }

  // 3. Fetch team events
  const isAthlete = sub.role === 'athlete' || sub.role === 'guardian';
  const events = (await getTeamEventsWithAttendanceCount(sub.teamId, sub.guardianOfId || sub.userId, isAthlete)) as unknown as EventInput[];
  if (!events) {
    throw new AppError("Team not found", 404, "team_not_found");
  }

  // 4. Build ICS feed
  const host = process.env['FRONTEND_URL'] || 'https://app.valkku.com';
  const domain = host.split("//")[1]?.split("/")[0] || 'app.valkku.com';

  const calendarName = `${sub.teamName}`;
  const calendarDesc = `Public schedule for team ${sub.teamId}`;
  const ics = eventsToICS(events, {
    calendarName,
    calendarDesc,
    prodId: "-//YourApp//Team Calendar//EN",
    domain,
    baseEventUrl: `https://${domain}/#/events`,
    includeDefaultAlarm: false,
    defaultDurationMinutes: 60,
    locale: user.preferredLanguage,
    guardedFirstName: guardedData?.[0]?.firstName
  });

  // 5. Always respond with fresh content (no caching)
  res
    .status(200)
    .set({
      "Content-Type": "text/calendar; charset=utf-8",
      // Prefer inline for subscriptions
      "Content-Disposition": `inline; filename="team-${sub.teamId}.ics"`,
      "Cache-Control": "no-cache, no-store, must-revalidate, private",
      "Pragma": "no-cache",
      "Expires": "0",
      "Last-Modified": new Date().toUTCString(),
      "ETag": `"${Date.now()}"`,
    })
    .send(ics);
});

export default router;