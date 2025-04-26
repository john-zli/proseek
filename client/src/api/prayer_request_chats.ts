import { api } from './helpers';
import type {
  AssignPrayerRequestChatParams,
  AssignPrayerRequestChatResponse,
  CreatePrayerRequestChatMessageParams,
  CreatePrayerRequestChatParams,
  CreatePrayerRequestChatResponse,
  ListPrayerRequestChatMessagesParams,
  ListPrayerRequestChatMessagesResponse,
  ListPrayerRequestChatsResponse,
  VerifyPrayerRequestChatParams,
  VerifyPrayerRequestChatResponse,
} from '@common/server-api/types/prayer_request_chats';

export type CaptchaProtected<T> = T & { token: string };

export const PrayerRequestChatsApi = {
  // Create a new prayer request chatroom
  createPrayerRequestChatroom: async (
    params: CaptchaProtected<CreatePrayerRequestChatParams>
  ): Promise<CreatePrayerRequestChatResponse> => {
    try {
      const response = await api.post<CreatePrayerRequestChatResponse>('/prayer-requests', params);
      return response;
    } catch (error) {
      throw new Error('Failed to create prayer request');
    }
  },

  // List prayer requests for a church
  listPrayerRequestChatroomsForChurch: async (churchId: string): Promise<ListPrayerRequestChatsResponse> => {
    try {
      const response = await api.get<ListPrayerRequestChatsResponse>(`/prayer-requests/church/${churchId}`);
      return response;
    } catch (error) {
      throw new Error('Failed to list prayer requests');
    }
  },

  // Assign a prayer request to a user
  assignPrayerRequestChatroomToUser: async (
    params: AssignPrayerRequestChatParams
  ): Promise<AssignPrayerRequestChatResponse> => {
    try {
      const response = await api.post<AssignPrayerRequestChatResponse>(`/prayer-requests/${params.requestId}/assign`, {
        userId: params.userId,
      });
      return response;
    } catch (error) {
      throw new Error('Failed to assign prayer request');
    }
  },

  // Verify chatroom access
  verifyChatroomAccess: async (
    params: CaptchaProtected<VerifyPrayerRequestChatParams>
  ): Promise<VerifyPrayerRequestChatResponse> => {
    try {
      const response = await api.post<VerifyPrayerRequestChatResponse>(`/prayer-requests/${params.requestId}/verify`, {
        requestContactEmail: params.requestContactEmail,
        requestContactPhone: params.requestContactPhone,
        token: params.token,
      });
      return response;
    } catch (error) {
      throw new Error('Failed to verify chatroom access');
    }
  },

  // Prayer Request Chat Message Functions
  createMessage: async (params: CreatePrayerRequestChatMessageParams): Promise<void> => {
    try {
      await api.post(`/prayer-requests/${params.requestId}/message`, {
        message: params.message,
        messageId: params.messageId,
        messageTimestamp: params.messageTimestamp,
        assignedUserId: params.assignedUserId,
      });
    } catch (error) {
      console.error(error);
      throw new Error('Failed to create prayer request chat message');
    }
  },

  listMessages: async (params: ListPrayerRequestChatMessagesParams): Promise<ListPrayerRequestChatMessagesResponse> => {
    try {
      const response = await api.get<ListPrayerRequestChatMessagesResponse>(
        `/prayer-requests/${params.requestId}/messages`
      );
      return response;
    } catch (error) {
      throw new Error('Failed to list prayer request chat messages');
    }
  },
};
