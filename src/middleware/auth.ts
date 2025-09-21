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

    if(payload.forcePasswordChange) {
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

export function requireScope(scopeString: string, scope: string) {
  return async (req: Request, res: Response, next: NextFunction) => {
    const teamId = req.params['teamId'] || req.query['teamId'] || req.body['teamId'];

    const user = req.user;
    const userTeams = user?.teams;

    const userTeam = userTeams?.find(team => team.teamId === teamId) as PublicTeamUser | undefined;

    if (!userTeam) {
      throw new AppError('Team not found', 404, 'team_not_found');
    }

    const roles = userTeam.roles as TeamUserRole[];
    const allowedRoles = scopes[scope as keyof typeof scopes][scopeString as keyof (typeof scopes)[keyof typeof scopes]] as readonly ROLES[];

    let allowed = false;
    for (const role of roles) {
      if (allowedRoles.includes(role.role)) {
        allowed = true;
        break;
      }
    }

    if (!allowed) {
      throw new AppError('Unauthorized', 403, 'unauthorized');
    }

    return next();
  }
}