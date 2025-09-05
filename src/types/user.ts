export interface User {
  id: string;
  email: string;
  name: string;
  pendingDetails: boolean;
  pendingJoinTeam: boolean;
  createdAt: Date;
  updatedAt: Date;
  isActive: boolean;
}

// Helper type to exclude sensitive fields from public responses
export type PublicUser = Omit<User, 'password'>;
