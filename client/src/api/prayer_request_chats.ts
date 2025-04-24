import { api } from './helpers';
import type {
  AssignPrayerRequestChatParams,
  AssignPrayerRequestChatResponse,
  CreatePrayerRequestChatMessageParams,
  CreatePrayerRequestChatMessageResponse,
  CreatePrayerRequestChatParams,
  CreatePrayerRequestChatResponse,
  ListPrayerRequestChatMessagesParams,
  ListPrayerRequestChatMessagesResponse,
  ListPrayerRequestChatsResponse,
} from '@common/server-api/types/prayer_request_chats';

export const PrayerRequestChatsApi = {
  // Create a new prayer request chatroom
  createPrayerRequestChatroom: async (
    params: CreatePrayerRequestChatParams
  ): Promise<CreatePrayerRequestChatResponse> => {
    try {
      const response = await api.post<CreatePrayerRequestChatResponse>('/prayer-request-chats', params);
      return response;
    } catch (error) {
      throw new Error('Failed to create prayer request');
    }
  },

  // List prayer requests for a church
  listPrayerRequestChatroomsForChurch: async (churchId: string): Promise<ListPrayerRequestChatsResponse> => {
    try {
      const response = await api.get<ListPrayerRequestChatsResponse>(`/prayer-request-chats/church/${churchId}`);
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
      const response = await api.post<AssignPrayerRequestChatResponse>(
        `/prayer-request-chats/${params.requestId}/assign`,
        {
          userId: params.userId,
        }
      );
      return response;
    } catch (error) {
      throw new Error('Failed to assign prayer request');
    }
  },

  // Prayer Request Chat Message Functions
  createMessage: async (
    params: CreatePrayerRequestChatMessageParams
  ): Promise<CreatePrayerRequestChatMessageResponse> => {
    try {
      const response = await api.post<CreatePrayerRequestChatMessageResponse>('/prayer-request-chat-messages', params);
      return response;
    } catch (error) {
      throw new Error('Failed to create prayer request chat message');
    }
  },

  listMessages: async (params: ListPrayerRequestChatMessagesParams): Promise<ListPrayerRequestChatMessagesResponse> => {
    try {
      const response = await api.get<ListPrayerRequestChatMessagesResponse>(
        `/prayer-request-chat-messages/${params.requestId}`
      );
      return response;
    } catch (error) {
      throw new Error('Failed to list prayer request chat messages');
    }
  },
};
