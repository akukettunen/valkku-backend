import { ROLES, NORMAL_ROLES } from "@/schemas/team";
import { PREFERRED_LANGUAGE } from "@/types/user";

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
}

export interface TeamUserRole {
  role: ROLES;
  userId: string;
  teamId: string;
  guardianOf?: string;
}

export interface PublicTeamUser {
  userId: string;
  teamId: string;
  teamName: string;
  email: string;
  createdAt: Date;
  roles: TeamUserRole[];
}

export interface Invite {
  id?: number;
  tokenHash: string;
  userId: string;
  validUntil: Date;
  createdAt?: Date;
  invitedBy: string;
  teamId: string;
  role: NORMAL_ROLES;
  guardianOf?: string | null;
}

// Invite without userId and tokenHash
export interface PublicInvite extends Omit<Invite, 'tokenHash'> {
  firstName: string;
  lastName: string;
  email: string;
}