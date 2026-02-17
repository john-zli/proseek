export interface User {
  userId: string;
  churchIds: string[];
  firstName: string;
  lastName: string;
  email: string;
  gender: string;
  creationTimestamp: number;
  modificationTimestamp: number;
  passwordHash: string;
}

// Sent to client — no sensitive data, no churchIds
export type SanitizedUser = Omit<User, 'passwordHash' | 'creationTimestamp' | 'modificationTimestamp' | 'churchIds'>;

// Stored in session — has churchIds for auth checks, no sensitive data
export type SessionUser = Omit<User, 'passwordHash' | 'creationTimestamp' | 'modificationTimestamp'>;
