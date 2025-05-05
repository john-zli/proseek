import { z } from 'zod';

// Schema for creating a new user
export const CreateUserSchema = z.object({
  body: z.object({
    email: z.string().email('Invalid email format'),
    firstName: z.string().min(1, 'First name is required'),
    lastName: z.string().min(1, 'Last name is required'),
    gender: z.enum(['Male', 'Female']),
    password: z.string().min(8, 'Password must be at least 8 characters long'),
    invitationCode: z.string().min(1, 'Invitation code is required'),
  }),
});

// Schema for user login
export const LoginUserSchema = z.object({
  body: z.object({
    email: z.string().email('Invalid email format'),
    password: z.string().min(1, 'Password is required'),
  }),
});
