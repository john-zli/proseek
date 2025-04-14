import type {
  AssignPrayerRequestParams,
  CreatePrayerRequestParams,
  PrayerRequest,
} from '@common/server-api/types/prayer_requests';

// API endpoints for prayer requests
const API_BASE = '/api';

export const PrayerRequestsApi = {
  // Create a new prayer request
  create: async (params: CreatePrayerRequestParams): Promise<PrayerRequest> => {
    const response = await fetch(`${API_BASE}/prayer-requests`, {
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
  listPrayerRequestsForChurch: async (churchId: string): Promise<PrayerRequest[]> => {
    const response = await fetch(`${API_BASE}/prayer-requests/church/${churchId}`);

    if (!response.ok) {
      throw new Error('Failed to list prayer requests');
    }

    return response.json();
  },

  // Assign a prayer request to a user
  assignPrayerRequestToUser: async (params: AssignPrayerRequestParams): Promise<PrayerRequest> => {
    const response = await fetch(`${API_BASE}/prayer-requests/${params.requestId}/assign`, {
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
