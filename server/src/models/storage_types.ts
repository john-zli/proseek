// At least one of them must be populated.
export type ListChurchesNearUserParams =
  | { zip: string; county?: string; city?: string }
  | { zip?: string; county: string; city?: string }
  | { zip?: string; county?: string; city: string };

export interface ListPrayerRequestsParams {
  churchId?: string;
  userId?: string;
}

/**
 * Return types from DB.
 */
export enum Gender {
  Male = 'Male',
  Female = 'Female',
}

export interface Church {
  churchId: string;
  name: string;
  address: string;
  city: string;
  state: string;
  zip: string;
  county: string;
  country: string;
}

export interface User {
  userId: string;
  churchId: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  gender: Gender;
}

export interface PrayerRequest {
  requestId: string;
  assignedUserId?: string;
  assignedChurchId?: string;
  responded: boolean;
  requestContactEmail?: string;
  requestContactPhone?: string;
  requestContactName?: string;
  requestContactMethod?: string;
  requestSummary: string;
  zip?: string;
  county?: string;
  city?: string;
  creationTimestamp: Date;
  modifiedTimestamp: Date;
}
