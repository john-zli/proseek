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
  state: string;
  address: string;
}

export interface CreatedUser {
  userId: string;
  churchId: string;
}
