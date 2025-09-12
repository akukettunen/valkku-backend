import { ROLES } from "@/schemas/team";

export interface Team {
  id: number;
  name: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface TeamUser { // what we get from query where we join teams and team_users
  userId: number;
  teamId: number;
  teamName: string;
  email: string;
  role: ROLES;
  guardianOfId?: number;
  joinedAt: Date;
}