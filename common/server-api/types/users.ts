export interface User {
  userId: string;
  churchId: string;
  firstName: string;
  lastName: string;
  email: string;
  gender: string;
  creationTimestamp: number;
  modifiedTimestamp: number;
  passwordHash?: string;
}

export type SanitizedUser = Omit<User, 'passwordHash' | 'creationTimestamp' | 'modifiedTimestamp'>;
