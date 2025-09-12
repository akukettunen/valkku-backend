import { Request, Response, NextFunction } from "express";
import dotenv from "dotenv";
import { verifyToken } from "@/utils/tokenHelper"
import { AppError } from "@/middleware/errors"
import { TeamUser } from "@/types/team"
import scopes from "@/utils/scopes"
import { ROLES } from "@/schemas/team";

dotenv.config();

/**
 * Middleware that requires a valid access token.
 * Usage: app.get('/protected', requireSignedIn, handler)
 */
export async function requireSignedIn(
  req: Request,
  res: Response,
  next: NextFunction
) {
  try {
    const authHeader = req.headers["authorization"]
    if (!authHeader?.startsWith("Bearer ")) {
      throw new AppError("Missing or invalid Authorization header", 401, "unauthorized")
    }

    console.log('authHeader', authHeader);

    const token = authHeader.substring("Bearer ".length).trim()
    const payload = await verifyToken<{ sub: string; role?: string; jti?: string, teams?: TeamUser[] }>(token)

    // attach to req for downstream handlers
    req.user = { id: parseInt(payload.sub), jti: payload.jti ?? '', teams: payload.teams ?? [] };
    return next()
  } catch (err: any) {
    return next(
      new AppError("Invalid or expired token", 401, "unauthorized")
    )
  }
}

// export async function requireScope(scopeString: string, scope: string) {
//   return (req: Request, res: Response, next: NextFunction) => {
//     const teamIdStringish = req.params['teamId'] || req.query['teamId'] || req.body['teamId'];
//     const teamId = teamIdStringish ? parseInt(teamIdStringish) : null;

//     const user = req.user;
//     const userTeams = user?.teams;

//     const userTeam = userTeams?.find(team => team.teamId === teamId) as TeamUser | undefined;
//     if (!userTeam) {
//       throw new AppError('Team not found', 404, 'team_not_found');
//     }

//     const role = userTeam.role as ROLES;
//     const allowedRoles = scopes[scope]

//     if (!allowedRoles.includes(role)) {
//       throw new AppError('Unauthorized', 403, 'unauthorized');
//     }

//     return next();
//   }
// }