import { z } from 'zod';

// Schema for creating a new prayer request chat message
export const CreatePrayerRequestChatMessageSchema = z.object({
  body: z.object({
    requestId: z.string().uuid(),
    message: z.string().min(1, 'Message is required'),
    userId: z.string().uuid().optional(),
  }),
});

// Schema for listing prayer request chat messages
export const ListPrayerRequestChatMessagesSchema = z.object({
  params: z.object({
    requestId: z.string().uuid(),
  }),
});
