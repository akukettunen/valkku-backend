export interface Team {
  id: number;
  name: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface TeamUser {
  userId: number;
  teamId: number;
  role: "owner" | "admin" | "coach" | "athlete" | "guardian";
  createdAt: Date;
  updatedAt: Date;

  guardianOfId?: number;
  futureGuardianOfAuth0Id?: string;
}