import { PublicTeamUser } from "./team";
import { ROLES } from "@/schemas/team";

export type PREFERRED_LANGUAGE = 'fi' | 'en';
export type USER_STATUS = 'invited' | 'active';

export interface User {
  id: string;
  email: string;
  emailLc: string;
  status: USER_STATUS;
  passwordHash: string;
  firstName?: string;
  lastName?: string;
  fullName?: string;
  emailConfirmed: boolean;
  pendingDetails: boolean;
  profilePictureUrl?: string;
  createdAt: Date;
  updatedAt: Date;
  emojiClickedCount: number;
  preferredLanguage: PREFERRED_LANGUAGE;
  forcePasswordChange: boolean;
  superAdmin: boolean;
}

export interface PublicUser {
  id: string;
  email: string;
  status: USER_STATUS;
  firstName?: string | undefined;
  lastName?: string | undefined;
  pendingDetails: boolean;
  emojiClickedCount: number;
  teams: PublicTeamUser[];
  preferredLanguage: PREFERRED_LANGUAGE;
  createdAt: Date;
  updatedAt: Date;
  superAdmin: boolean;
  forcePasswordChange: boolean;
}

export interface TokenUser {
  superAdmin?: boolean;
  sub: string,
  teams: MinimalTeamUser[],
  jti: string,
  forcePasswordChange: boolean;
}

export interface MinimalTeamUser {
  roles: MinimalTeamUserRole[],
  teamId: string,
}

export interface MinimalTeamUserRole {
  role: ROLES,
  guardianOf?: string,
}

export interface UserInTeam {
  userId: string;
  firstName?: string | undefined;
  lastName?: string | undefined;
  fullName?: string | undefined;
  preferredLanguage: PREFERRED_LANGUAGE;
  status: USER_STATUS;
  createdAt: Date;
  teamId: string;
  role: ROLES;
}