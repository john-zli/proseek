export interface PrayerRequestChat {
  requestId: string;
  assignedUserId: string | null;
  assignedChurchId: string | null;
  responded: boolean;
  requestContactEmail: string | null;
  requestContactPhone: string | null;
  zip: string | null;
  city: string | null;
  creationTimestamp: number;
  modificationTimestamp: number;
  matchNotificationTimestamp: number | null;
}

interface PrayerRequestChatMessageParams
  extends Omit<PrayerRequestChatMessage, 'requestId' | 'userId' | 'senderName' | 'deletionTimestamp'> {
  userId?: string;
}

export interface CreatePrayerRequestChatParams {
  requestContactEmail?: string;
  requestContactPhone?: string;
  zip?: string;
  city?: string;
  region?: string;
  churchId?: string;
  messages: PrayerRequestChatMessageParams[];
}

export interface AssignPrayerRequestChatToUserParams {
  requestId: string;
  userId: string;
}

export interface ListPrayerRequestChatsParams {
  userId?: string;
  churchId?: string;
  onlyUnnotified?: boolean;
}

// Chat Message Types
export interface PrayerRequestChatMessage {
  messageId: string;
  requestId: string;
  message: string;
  messageTimestamp: number;
  userId: string | null;
  senderName: string | null;
  deletionTimestamp: number | null;
}

export interface CreatePrayerRequestChatMessageParams {
  messageId: string;
  requestId: string;
  message: string;
  userId?: string;
  messageTimestamp: number;
}

// Socket event payload
export interface ChatMessagePayload {
  messageId: string;
  requestId: string;
  message: string;
  messageTimestamp: number;
  userId: string | null;
  senderName: string | null;
}

export interface ListPrayerRequestChatMessagesParams {
  requestId: string;
}

export interface CreatePrayerRequestChatResponse {
  chatroomId: string;
}

export interface ListPrayerRequestChatsResponse {
  prayerRequests: PrayerRequestChat[];
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
