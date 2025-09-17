import { PublicTeamUser } from "./team";
import { ROLES } from "@/schemas/team";

export type PREFERRED_LANGUAGE = 'fi' | 'en';

export interface User {
  id: string;
  email: string;
  passwordHash: string;
  firstName?: string | undefined;
  lastName?: string | undefined;
  pendingDetails: boolean;
  createdAt: Date;
  updatedAt: Date;
  emojiClickedCount: number;
  preferredLanguage: PREFERRED_LANGUAGE;
}

export interface PublicUser {
  id: string;
  firstName?: string | undefined;
  lastName?: string | undefined;
  pendingDetails: boolean;
  emojiClickedCount: number;
  currentTeamId: string | null;
  teams: PublicTeamUser[];
  preferredLanguage: PREFERRED_LANGUAGE;
  createdAt: Date;
  updatedAt: Date;
}

export interface TokenUser {
  sub: string,
  teams: MinimalTeamUser[],
  jti: string,
}

export interface MinimalTeamUser {
  roles: MinimalTeamUserRole[],
  teamId: string,
  guardianOfId?: string,
}

export interface MinimalTeamUserRole {
  role: ROLES,
  guardianOfId?: string,
}

export interface UserInTeam {
  userId: string;
  firstName?: string | undefined;
  lastName?: string | undefined;
  createdAt: Date;
  teamId: string;
  role: ROLES;
}