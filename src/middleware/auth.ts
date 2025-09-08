import { auth } from "express-oauth2-jwt-bearer";
import { Request, Response, NextFunction } from "express";
import scopes from "@/utils/scopes";
import dotenv from "dotenv";
import { TeamUser } from "@/types/team";
import { getTeamUserByAuth0IdAndTeamId } from "@/db/team";

dotenv.config();

// Validate required environment variables
const AUTH0_AUDIENCE = process.env["AUTH0_AUDIENCE"];
const AUTH0_DOMAIN = process.env["AUTH0_DOMAIN"];

if (!AUTH0_AUDIENCE || !AUTH0_DOMAIN) {
  throw new Error("Missing required Auth0 environment variables: AUTH0_AUDIENCE and AUTH0_DOMAIN");
}

const checkJwt = auth({
  audience: AUTH0_AUDIENCE,
  issuerBaseURL: `https://${AUTH0_DOMAIN}`,
  tokenSigningAlg: "RS256",
});

function attachAuth0User(req: Request, res: Response, next: NextFunction) {
  try {
    const payload = req.auth?.payload;

    if (!payload) {
      return res.status(401).json({ error: "Missing JWT payload" });
    }

    const sub = payload.sub;

    if (!sub) {
      return res.status(401).json({ error: "Missing sub in token" });
    }

    req.auth0Id = sub;

    next();
    return;
  } catch (err) {
    console.error("Auth middleware error:", err);
    return res.status(401).json({ error: "Invalid authentication token" });
  }
}

// 4. Export a combined middleware
export const requireAuth = [checkJwt, attachAuth0User];

export const authorize = (scopeString: string, scope: 'team' | 'individual') => {
  return async (req: Request, res: Response, next: NextFunction) => {
    const auth0Id = req.auth0Id;
    const teamId = req.params['teamId'] || req.body['teamId'];

    const [ teamUser ] = await getTeamUserByAuth0IdAndTeamId(auth0Id!, teamId) as TeamUser[];

    if(!teamUser) {
      return res.status(403).json({ error: "Unauthorized" });
    }

    const allowedScopes = scopes[scope][scopeString as keyof typeof scopes[typeof scope]]; // Get the allowed users scoped for this action
    if(allowedScopes.includes(teamUser.role)) {
      next();
      return;
    } else {
      return res.status(403).json({ error: "Unauthorized" });
    }
  };
};