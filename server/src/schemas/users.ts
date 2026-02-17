import { z } from 'zod';

// Schema for creating a new user
export const CreateAdminUserSchema = z.object({
  body: z.object({
    email: z.string().email('Invalid email format'),
    firstName: z.string().min(1, 'First name is required'),
    lastName: z.string().min(1, 'Last name is required'),
    gender: z.enum(['Male', 'Female']),
    password: z.string().min(8, 'Password must be at least 8 characters long'),
    churchId: z.string().uuid('Invalid church ID'),
  }),
});

// Schema for creating a new user
export const CreateUserSchema = z.object({
  body: z.object({
    email: z.string().email('Invalid email format'),
    firstName: z.string().min(1, 'First name is required'),
    lastName: z.string().min(1, 'Last name is required'),
    gender: z.enum(['Male', 'Female']),
    password: z.string().min(8, 'Password must be at least 8 characters long'),
    invitationCode: z.string().min(1, 'Invitation code is required').optional(),
  }),
});

// Schema for user login
export const LoginUserSchema = z.object({
  body: z.object({
    email: z.string().email('Invalid email format'),
    password: z.string().min(1, 'Password is required'),
  }),
});

// Schema for inviting a user
export const InviteUserSchema = z.object({
  body: z.object({
    email: z.string().email('Valid email is required for invitation'),
    churchId: z.string().uuid('Valid church ID is required'),
  }),
});

// Schema for looking up an invitation by code
export const GetInvitationSchema = z.object({
  query: z.object({
    code: z.string().min(1, 'Invitation code is required'),
  }),
});
