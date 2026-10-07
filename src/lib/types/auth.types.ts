export type UserRole = "admin" | "captain" | "umpire" | "public";

export interface User {
  id: string;
  username: string;
  passwordHash: string;
  role: UserRole;
  displayName: string;
  teamId?: string; // Applicable if user is a Captain
}

export interface SessionData {
  userId: string;
  username: string;
  role: UserRole;
  displayName: string;
  teamId?: string;
  expiresAt: number;
}
