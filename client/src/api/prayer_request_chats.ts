import type {
  AssignPrayerRequestChatParams,
  CreatePrayerRequestChatParams,
  PrayerRequestChat,
} from '@common/server-api/types/prayer_request_chats';

// API endpoints for prayer requests
const API_BASE = '/api';

export const PrayerRequestChatsApi = {
  // Create a new prayer request
  create: async (params: CreatePrayerRequestChatParams): Promise<PrayerRequestChat> => {
    const response = await fetch(`${API_BASE}/prayer-request-chats`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(params),
    });

    if (!response.ok) {
      throw new Error('Failed to create prayer request');
    }

    return response.json();
  },

  // List prayer requests for a church
  listPrayerRequestChatsForChurch: async (churchId: string): Promise<PrayerRequestChat[]> => {
    const response = await fetch(`${API_BASE}/prayer-request-chats/church/${churchId}`);

    if (!response.ok) {
      throw new Error('Failed to list prayer requests');
    }

    return response.json();
  },

  // Assign a prayer request to a user
  assignPrayerRequestToUser: async (params: AssignPrayerRequestChatParams): Promise<PrayerRequestChat> => {
    const response = await fetch(`${API_BASE}/prayer-request-chats/${params.requestId}/assign`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ userId: params.userId }),
    });

    if (!response.ok) {
      throw new Error('Failed to assign prayer request');
    }

    return response.json();
  },
};
