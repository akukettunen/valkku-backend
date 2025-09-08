import { Team } from "./team";

export interface User {
  id: number;
  auth0Id: string;
  firstName?: string | undefined;
  lastName?: string | undefined;
  pendingDetails: boolean;
  createdAt: Date;
  updatedAt: Date;
  emojiClickedCount: number;
}

export interface PublicUser {
  id: number;
  auth0Id: string;
  firstName?: string | undefined;
  lastName?: string | undefined;
  pendingDetails: boolean;
  emojiClickedCount: number;
  teams: Team[];
}