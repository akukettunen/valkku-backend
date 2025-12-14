import { Request, Response, NextFunction } from "express";
import dotenv from "dotenv";
import dotenvExpand from "dotenv-expand";
import { verifyToken } from "@/utils/tokenHelper"
import { AppError } from "@/middleware/errors"
import { PublicTeamUser, TeamUser, TeamUserRole } from "@/types/team"
import scopes from "@/utils/scopes"
import { ROLES } from "@/types/team";
import { TokenUser } from "@/types/user";
import { OBJECT_SCOPE } from "@/types/general";

dotenvExpand.expand(dotenv.config({ quiet: true }));

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

    // Enforce password change only when explicitly true
    if(payload.forcePasswordChange === true) {
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

export function requireSuperAdmin(req: Request, res: Response, next: NextFunction) {
  if(!req.user?.superAdmin || req.user?.superAdmin === undefined || String(req.user?.superAdmin) === 'false') {
    throw new AppError('Unauthorized', 403, 'unauthorized');
  }
  return next();
}

export function validateBasedOnScope(action: string) {
  return (req: Request, res: Response, next: NextFunction) => {
    const { scope } = (req.body?.scope ? req.body : req.query) as { scope?: OBJECT_SCOPE };

    if (!scope) throw new AppError('Scope is required', 400, 'something_went_wrong');
    if(!action) throw new AppError('Action is required', 400, 'something_went_wrong');

    switch (scope) {
      case 'team':
        return requireScope(action, 'team')(req, res, next);
      case 'user':
        return requireScope(action, 'individual')(req, res, next);
      case 'club':
        throw new AppError('Club scope is not supported yet', 403, 'unauthorized');
      case 'global':
        return requireSuperAdmin(req, res, next);
      default:
        throw new AppError(`Unsupported scope: ${scope}`, 400, 'something_went_wrong');
    }
  };
}

export function requireScope(scopeString: string, scope: 'individual' | 'team' | 'club') {
  return async (req: Request, res: Response, next: NextFunction) => {
    if(scope === 'club') {
      throw new AppError('Club scope is not supported yet', 403, 'unauthorized');
    }

    let teamId = req.params['teamId'] || req.query['teamId'] || req.body['teamId'];
    let userId = req.params['userId'] || req.query['userId'] || req.body['userId'] || req.user?.sub;

    const user = req.user;
    const userTeams = user?.teams;

    const roles = scope === 'team'
      ? userTeams?.find(team => team.teamId === teamId)?.roles as TeamUserRole[]
      : userTeams?.flatMap(team => team.roles) as TeamUserRole[];

    if (!roles && scope === 'team') {
      throw new AppError('Team not found', 404, 'team_not_found');
    }
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

    console.log('allowed', allowed);

    if (!allowed) {
      throw new AppError('Unauthorized', 403, 'unauthorized');
    }

    return next();
  }
}