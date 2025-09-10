import { ROLES } from "@/schemas/team";

export interface Team {
  id: number;
  name: string;
  created_at: Date;
  updated_at: Date;
}

export interface TeamUser {
  user_id: number;
  team_id: number;
  role: ROLES;
  created_at: Date;
  updated_at: Date;

  guardian_of_id?: number;
  future_guardian_of_email?: string;
}