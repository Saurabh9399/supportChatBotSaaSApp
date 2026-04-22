export interface User {
  id: string;
  email: string;
  name: string;
  avatarUrl?: string;
  role: UserRole;
  tenantId: string;
  createdAt: string;
  updatedAt: string;
}

export type UserRole = "owner" | "admin" | "agent" | "viewer";

export interface UserSession {
  userId: string;
  tenantId: string;
  role: UserRole;
  expiresAt: string;
}
