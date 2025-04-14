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
  creationTimestamp: Date;
  modifiedTimestamp: Date;
}

export interface User {
  userId: string;
  churchId: string;
  name: string;
  email: string;
  creationTimestamp: Date;
  modifiedTimestamp: Date;
}
