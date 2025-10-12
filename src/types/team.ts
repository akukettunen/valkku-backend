import { USER_STATUS } from "@/types/user";

export type ROLES = 'owner' | 'admin' | 'coach' | 'athlete' | 'guardian';
export type NORMAL_ROLES = 'admin' | 'coach' | 'athlete' | 'guardian';

export interface Team {
  id: string;
  name: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface TeamUser { // what we get from query where we join teams and team_users
  userId: string;
  teamId: string;
  teamName: string;
  email: string;
  createdAt: Date;
  status: USER_STATUS;
  tokenHash: string;
  validUntil: Date;
  invitedBy: string;
}

export interface PublicTeamUser extends TeamUser {
  roles: TeamUserRole[];
}

export interface TeamUserRole {
  role: ROLES;
  userId: string;
  teamId: string;
  guardianOf?: string;
}