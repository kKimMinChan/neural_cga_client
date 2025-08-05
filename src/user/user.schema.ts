import { z } from 'zod';

export const CreateUserSchema = z.object({
  email: z.string().email(),
  password: z
    .string()
    .min(4, 'Password must be at least 4 characters long')
    .max(50),
  name: z.string().min(2, 'Name is required').max(100),
  role: z.enum(['admin', 'user', 'superAdmin']).default('user'),
  companyId: z.string().uuid('Invalid company ID format'),
});

export const SyncUserSchema = z.object({
  id: z.string().uuid('Invalid user ID format'),
  email: z.string().email(),
  password: z
    .string()
    .min(4, 'Password must be at least 4 characters long')
    .max(50),
  name: z.string().min(2, 'Name is required').max(100),
  role: z.enum(['admin', 'user', 'superAdmin']).default('user'),
  companyId: z.string().uuid('Invalid company ID format'),
});

export type SyncStatus = 'pending' | 'synced' | 'failed';

export type CreateUserInput = z.infer<typeof CreateUserSchema>;
export type SyncUserInput = z.infer<typeof SyncUserSchema>;
