import { Request, Response, NextFunction } from "express";
import dotenv from "dotenv";
import { verifyToken } from "@/utils/tokenHelper"
import { AppError } from "@/middleware/errors"
import { PublicTeamUser, TeamUser, TeamUserRole } from "@/types/team"
import scopes from "@/utils/scopes"
import { ROLES } from "@/schemas/team";
import { TokenUser } from "@/types/user";

dotenv.config({ quiet: true });

/**
 * Middleware that requires a valid access token.
 * Usage: app.get('/protected', requireSignedIn, handler)
 */
export async function requireSignedIn(
  req: Request,
  _res: Response,
  next: NextFunction
) {
  try {
    const authHeader = req.headers["authorization"]
    if (!authHeader?.startsWith("Bearer ")) {
      throw new AppError("Missing or invalid Authorization header", 401, "unauthorized")
    }

    const token = authHeader.substring("Bearer ".length).trim()
    const payload = await verifyToken<TokenUser>(token)

    if(payload.forcePasswordChange || payload.forcePasswordChange === undefined) {
      throw new AppError('Force password change', 401, 'force_password_change');
    }

    // attach to req for downstream handlers
    req.user = payload;
    return next()
  } catch (err: any) {
    return next(
      new AppError("Invalid or expired token", 401, "unauthorized")
    )
  }
}

export function requireScope(scopeString: string, scope: 'individual' | 'team') {
  return async (req: Request, res: Response, next: NextFunction) => {
    const teamId = req.params['teamId'] || req.query['teamId'] || req.body['teamId'];
    const userId = req.params['userId'] || req.query['userId'] || req.body['userId'];

    const user = req.user;
    const userTeams = user?.teams;
    const userTeam = userTeams?.find(team => team.teamId === teamId) as PublicTeamUser | undefined;
    if (!userTeam) {
      throw new AppError('Team not found', 404, 'team_not_found');
    }
    const roles = userTeam.roles as TeamUserRole[];
    const allowedRoles = scopes[scope as keyof typeof scopes][scopeString as keyof (typeof scopes)[keyof typeof scopes]] as readonly (ROLES | 'guardian-as-athlete' | 'self')[];

    let allowed = false;
    console.log('allowedRoles', allowedRoles);
    console.log('roles', roles);
    console.log('userId', userId);
    console.log('req.user?.sub', req.user?.sub);
    console.log('scope', scope);
    console.log('scopeString', scopeString);
    if(scope === 'individual') {
      if(allowedRoles?.includes('guardian-as-athlete') && roles.some(role => role.guardianOf === userId)) {
        allowed = true;
      }
      if(allowedRoles?.includes('self') && req.user?.sub === userId) {
        allowed = true;
      }
    } else if(scope === 'team') {
      for (const role of roles) {
        if (allowedRoles?.includes(role.role)) {
          allowed = true;
          break;
        }
      }
    }

    if (!allowed) {
      throw new AppError('Unauthorized', 403, 'unauthorized');
    }

    return next();
  }
}