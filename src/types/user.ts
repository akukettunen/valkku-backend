import { Team } from "./team";

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
}

export interface PublicUser {
  id: number;
  firstName?: string | undefined;
  lastName?: string | undefined;
  pendingDetails: boolean;
  emojiClickedCount: number;
  currentTeamId: number | null;
  teams: Team[];
}

export interface UserInTeam {
  id: number; // userId
  firstName?: string | undefined;
  lastName?: string | undefined;
  joinedAt: Date;
  teamId: number;
  role: "owner" | "admin" | "coach" | "athlete" | "guardian";
}