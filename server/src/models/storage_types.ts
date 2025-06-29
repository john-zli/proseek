// At least one of them must be populated.
export interface ListChurchesNearUserParams {
  zip?: string;
  county?: string;
  city?: string;
}

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
