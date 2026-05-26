export type UserRole = 'admin' | 'event_admin';

export interface UserRoleAssignment {
  id: string;
  userId: string;
  role: UserRole;
  eventIds?: string[]; // For event_admin: which events they can manage
  createdAt: Date;
  createdBy: string;
}

export interface UserWithRole {
  uid: string;
  email: string | null;
  displayName: string | null;
  photoURL: string | null;
  roles: UserRoleAssignment[];
  createdAt?: Date;
}
