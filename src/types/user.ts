export interface PrivateUser {
  id: number;
  auth0Id: string;
  firstName: string;
  lastName: string;
  pendingDetails: boolean;
  pendingJoinTeam: boolean;
  createdAt: Date;
  updatedAt: Date;
  emojiClickedCount: number;
  password: string;
}

// Helper type to exclude sensitive fields from public responses
export type PublicUser = Omit<PrivateUser, 'password'>;
