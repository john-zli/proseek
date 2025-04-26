import { z } from 'zod';

// Helper function to normalize phone numbers
const normalizePhoneNumber = (phone: string | undefined) => (phone ? phone.replace(/[^0-9]/g, '') : undefined);

// Schema for creating a new prayer request chat
export const CreatePrayerRequestChatSchema = z.object({
  body: z.object({
    requestContactEmail: z.string().email().optional(),
    requestContactPhone: z.string().optional().transform(normalizePhoneNumber),
    messages: z.array(
      z.object({
        message: z.string().min(1, 'Message is required'),
        messageId: z.string().uuid(),
        messageTimestamp: z.number().int().nonnegative(),
        assignedUserId: z.string().uuid().optional(),
      })
    ),
    zip: z.string().optional(),
    city: z.string().optional(),
    token: z.string(), // CAPTCHA token
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

// Schema for creating a new prayer request chat message
export const CreatePrayerRequestChatMessageSchema = z.object({
  params: z.object({
    requestId: z.string().min(1, 'Request ID is required'),
  }),
  body: z.object({
    message: z.string().min(1, 'Message is required'),
    assignedUserId: z.string().optional(),
    messageId: z.string().uuid(),
  }),
});

// Schema for listing prayer request chat messages
export const ListPrayerRequestChatMessagesSchema = z.object({
  params: z.object({
    requestId: z.string().min(1, 'Request ID is required'),
  }),
});

export const VerifyPrayerRequestChatSchema = z.object({
  params: z.object({
    requestId: z.string().min(1, 'Request ID is required'),
  }),
  body: z.object({
    requestContactEmail: z.string().email().optional(),
    requestContactPhone: z.string().optional().transform(normalizePhoneNumber),
    token: z.string(), // CAPTCHA token
  }),
});
