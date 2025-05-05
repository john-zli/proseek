export interface PrayerRequestChat {
  requestId: string;
  assignedUserId?: string;
  assignedChurchId?: string;
  responded: boolean;
  requestContactEmail?: string;
  requestContactPhone?: string;
  zip?: string;
  city?: string;
  creationTimestamp: number;
  modificationTimestamp: number;
}

export interface CreatePrayerRequestChatParams {
  requestContactEmail?: string;
  requestContactPhone?: string;
  zip?: string;
  city?: string;
  region?: string;
  messages: Omit<PrayerRequestChatMessage, 'requestId'>[];
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
  messageId: string;
  requestId: string;
  message: string;
  assignedUserId?: string;
  messageTimestamp: number;
}

export interface ListPrayerRequestChatMessagesParams {
  requestId: string;
}

export interface CreatePrayerRequestChatResponse {
  chatroomId: string;
}

export interface ListPrayerRequestChatsResponse {
  chatrooms: PrayerRequestChat[];
}

export interface AssignPrayerRequestChatResponse {
  chatroomId: string;
}

export interface ListPrayerRequestChatMessagesResponse {
  messages: PrayerRequestChatMessage[];
}

export interface VerifyPrayerRequestChatParams {
  requestId: string;
  requestContactEmail?: string;
  requestContactPhone?: string;
}

export interface VerifyPrayerRequestChatResponse {
  isVerified: boolean;
}
