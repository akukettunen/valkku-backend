import { auth } from 'express-oauth2-jwt-bearer';
import dotenv from 'dotenv';
dotenv.config();

// Validate required environment variables
const AUTH0_AUDIENCE = process.env['AUTH0_AUDIENCE'];
const AUTH0_DOMAIN = process.env['AUTH0_DOMAIN'];

if (!AUTH0_AUDIENCE || !AUTH0_DOMAIN) {
  throw new Error('Missing required Auth0 environment variables: AUTH0_AUDIENCE and AUTH0_DOMAIN');
}

// Auth0 JWT validation middleware
export const requireAuth = auth({
  audience: AUTH0_AUDIENCE,
  issuerBaseURL: `https://${AUTH0_DOMAIN}`,
  tokenSigningAlg: 'RS256'
});

// Optional: Custom middleware to extract user info
export const extractUser = (req: any, res: any, next: any) => {
  if (req.auth) {
    req.user = {
      id: req.auth.sub,
      email: req.auth.email,
      name: req.auth.name,
      // Add other claims as needed
    };
  }
  next();
};
