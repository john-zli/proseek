import { z } from 'zod';

// Schema for creating a new prayer request chat
export const CreatePrayerRequestChatSchema = z.object({
  body: z.object({
    requestSummary: z.string().min(1, 'Prayer request summary is required'),
    requestContactEmail: z.string().email().optional(),
    requestContactPhone: z.string().optional(),
    requestContactName: z.string().optional(),
    requestContactMethod: z.string().optional(),
    zip: z.string().optional(),
    county: z.string().optional(),
    city: z.string().optional(),
  }),
});

// Schema for listing prayer request chats by church
export const ListPrayerRequestChatsSchema = z.object({
  params: z.object({
    churchId: z.string().min(1, 'Church ID is required'),
  }),
});

// Schema for assigning a prayer request chat
export const AssignPrayerRequestChatSchema = z.object({
  params: z.object({
    requestId: z.string().min(1, 'Request ID is required'),
  }),
  body: z.object({
    userId: z.string().min(1, 'User ID is required'),
  }),
});
