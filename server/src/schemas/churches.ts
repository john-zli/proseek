import { z } from 'zod';

export const CreateChurchSchema = z.object({
  body: z.object({
    name: z.string().min(1, 'Church name is required'),
    address: z.string().min(1, 'Address is required'),
    city: z.string().min(1, 'City is required'),
    state: z.string().min(1, 'State is required'),
    zip: z.string().min(1, 'ZIP code is required'),
    phone: z.string().optional(),
    email: z.string().email().optional(),
    website: z.string().url().optional(),
  }),
});

export const CreateUserSchema = z.object({
  body: z.object({
    email: z.string().email('Valid email is required'),
    firstName: z.string().min(1, 'First name is required'),
    lastName: z.string().min(1, 'Last name is required'),
    role: z.enum(['admin', 'pastor', 'member'], {
      errorMap: () => ({ message: 'Role must be one of: admin, pastor, member' }),
    }),
    churchId: z.string().min(1, 'Church ID is required'),
  }),
});
