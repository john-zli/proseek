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

export interface CreatePrayerRequestParams {
  requestSummary: string;
  requestContactEmail?: string;
  requestContactPhone?: string;
  requestContactName?: string;
  requestContactMethod?: string;
  zip?: string;
  county?: string;
  city?: string;
}

export interface AssignPrayerRequestParams {
  requestId: string;
  userId: string;
}

export interface ListPrayerRequestsParams {
  userId?: string;
  churchId?: string;
}
