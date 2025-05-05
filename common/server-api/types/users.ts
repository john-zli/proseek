export interface User {
  userId: string;
  churchId: string;
  firstName: string;
  lastName: string;
  email: string;
  gender: string;
  creationTimestamp: number;
  modificationTimestamp: number;
  passwordHash?: string;
}

export type SanitizedUser = Omit<User, 'passwordHash' | 'creationTimestamp' | 'modificationTimestamp'>;
