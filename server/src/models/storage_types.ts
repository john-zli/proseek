// Additional server-specific types can go here

// At least one of them must be populated.
export type ListChurchesNearUserParams =
  | {
      zip: string;
      county?: never;
      city?: never;
    }
  | {
      zip?: never;
      county: string;
      city: string;
    };

export interface Church {
  churchId: string;
  name: string;
  zip: string;
  county: string;
  city: string;
  creationTimestamp: number;
  modifiedTimestamp: number;
}

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

export interface CreatedUser {
  userId: string;
  churchId: string;
}
