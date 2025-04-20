import { api } from './helpers';
import type {
  AssignPrayerRequestChatParams,
  CreatePrayerRequestChatMessageParams,
  CreatePrayerRequestChatParams,
  ListPrayerRequestChatMessagesParams,
  PrayerRequestChat,
  PrayerRequestChatMessage,
} from '@common/server-api/types/prayer_request_chats';

export const PrayerRequestChatsApi = {
  // Create a new prayer request chatroom
  createPrayerRequestChatroom: async (params: CreatePrayerRequestChatParams): Promise<PrayerRequestChat> => {
    try {
      const response = await api.post<PrayerRequestChat>('/prayer-request-chats', params);
      return response;
    } catch (error) {
      throw new Error('Failed to create prayer request');
    }
  },

  // List prayer requests for a church
  listPrayerRequestChatroomsForChurch: async (churchId: string): Promise<PrayerRequestChat[]> => {
    try {
      const response = await api.get<PrayerRequestChat[]>(`/prayer-request-chats/church/${churchId}`);
      return response;
    } catch (error) {
      throw new Error('Failed to list prayer requests');
    }
  },

  // Assign a prayer request to a user
  assignPrayerRequestChatroomToUser: async (params: AssignPrayerRequestChatParams): Promise<PrayerRequestChat> => {
    try {
      const response = await api.post<PrayerRequestChat>(`/prayer-request-chats/${params.requestId}/assign`, {
        userId: params.userId,
      });
      return response;
    } catch (error) {
      throw new Error('Failed to assign prayer request');
    }
  },

  // Prayer Request Chat Message Functions
  createMessage: async (params: CreatePrayerRequestChatMessageParams): Promise<PrayerRequestChatMessage> => {
    try {
      const response = await api.post<PrayerRequestChatMessage>('/prayer-request-chat-messages', params);
      return response;
    } catch (error) {
      throw new Error('Failed to create prayer request chat message');
    }
  },

  listMessages: async (params: ListPrayerRequestChatMessagesParams): Promise<PrayerRequestChatMessage[]> => {
    try {
      const response = await api.get<PrayerRequestChatMessage[]>(`/prayer-request-chat-messages/${params.requestId}`);
      return response;
    } catch (error) {
      throw new Error('Failed to list prayer request chat messages');
    }
  },
};
