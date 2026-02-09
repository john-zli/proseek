import { z } from 'zod';

export const ChurchIdParamsSchema = z.object({
  params: z.object({
    churchId: z.string().uuid('Invalid church ID'),
  }),
});

export const UpdateChurchSchema = z.object({
  body: z.object({
    name: z.string().min(1, 'Church name is required'),
    address: z.string().min(1, 'Address is required'),
    city: z.string().min(1, 'City is required'),
    state: z.string().min(1, 'State is required'),
    zip: z.string().min(1, 'ZIP code is required'),
    county: z.string().min(1, 'County is required'),
    email: z.string().email('Valid email is required'),
  }),
  params: z.object({
    churchId: z.string().uuid('Invalid church ID'),
  }),
});

export const UserIdParamsSchema = z.object({
  params: z.object({
    userId: z.string().uuid('Invalid user ID'),
  }),
});

export const UpdateUserSchema = z.object({
  body: z.object({
    firstName: z.string().min(1, 'First name is required'),
    lastName: z.string().min(1, 'Last name is required'),
    email: z.string().email('Invalid email format'),
    gender: z.enum(['Male', 'Female']),
  }),
  params: z.object({
    userId: z.string().uuid('Invalid user ID'),
  }),
});
