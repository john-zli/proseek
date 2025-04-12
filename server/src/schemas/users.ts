import { z } from 'zod';

export const CreateUserSchema = z.object({
  body: z.object({
    email: z.string().email('Valid email is required'),
    firstName: z.string().min(1, 'First name is required'),
    lastName: z.string().min(1, 'Last name is required'),
    churchId: z.string().min(1, 'Church ID is required'),
  }),
});
