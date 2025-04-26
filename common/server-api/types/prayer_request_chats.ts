export interface PrayerRequestChat {
  requestId: string;
  assignedUserId?: string;
  assignedChurchId?: string;
  responded: boolean;
  requestContactEmail?: string;
  requestContactPhone?: string;
  zip?: string;
  city?: string;
  creationTimestamp: Date;
  modifiedTimestamp: Date;
}

export interface CreatePrayerRequestChatParams {
  requestContactEmail?: string;
  requestContactPhone?: string;
  zip?: string;
  city?: string;
  messages: { text: string; userId?: string; messageId: string; timestamp: number }[];
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

export interface CreatePrayerRequestChatMessageResponse {
  messageId: string;
}

export interface ListPrayerRequestChatMessagesResponse {
  messages: PrayerRequestChatMessage[];
}
