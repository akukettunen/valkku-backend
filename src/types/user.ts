import { Team, TeamUser } from "./team";
import { ROLES } from "@/schemas/team";

export interface User {
  id: number;
  email: string;
  passwordHash: string;
  firstName?: string | undefined;
  lastName?: string | undefined;
  pendingDetails: boolean;
  createdAt: Date;
  updatedAt: Date;
  emojiClickedCount: number;
  preferredLanguage: 'fi' | 'en';
}

export interface PublicUser {
  id: number;
  firstName?: string | undefined;
  lastName?: string | undefined;
  pendingDetails: boolean;
  emojiClickedCount: number;
  currentTeamId: number | null;
  teams: TeamUser[];
  preferredLanguage: 'fi' | 'en';
  createdAt: Date;
  updatedAt: Date;
}

export interface MinimalTeamUser {
  role: ROLES,
  teamId: number,
  guardianOfId?: number,
}

export interface TokenUser {
  sub: string,
  teams: MinimalTeamUser[],
  jti: string,
}

export interface UserInTeam {
  id: number; // userId
  firstName?: string | undefined;
  lastName?: string | undefined;
  joinedAt: Date;
  teamId: number;
  role: "owner" | "admin" | "coach" | "athlete" | "guardian";
}