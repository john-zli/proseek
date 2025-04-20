export interface PrayerRequestChat {
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

export interface CreatePrayerRequestChatParams {
  requestSummary: string;
  requestContactEmail?: string;
  requestContactPhone?: string;
  requestContactName?: string;
  requestContactMethod?: string;
  zip?: string;
  county?: string;
  city?: string;
}

export interface AssignPrayerRequestChatParams {
  requestId: string;
  userId: string;
}

export interface ListPrayerRequestChatsParams {
  userId?: string;
  churchId?: string;
}

// Chat Message Types
export interface PrayerRequestChatMessage {
  messageId: string;
  requestId: string;
  message: string;
  messageTimestamp: number;
  assignedUserId?: string;
  deletionTimestamp?: number;
}

export interface CreatePrayerRequestChatMessageParams {
  requestId: string;
  message: string;
  assignedUserId?: string;
}

export interface ListPrayerRequestChatMessagesParams {
  requestId: string;
}
