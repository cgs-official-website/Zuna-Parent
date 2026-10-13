import { z } from 'zod';

const systemRoles = ['SUPER_ADMIN', 'SUPPORT_LEAD', 'SUPPORT_ENGINEER', 'PRODUCT_MANAGER'];

export const createRoleSchema = z.object({
  name: z.string().min(2, 'Role name must be at least 2 characters').trim(),
  description: z.string().optional().default(''),
  baseRole: z.enum(['SUPER_ADMIN', 'SUPPORT_LEAD', 'SUPPORT_ENGINEER', 'PRODUCT_MANAGER']).default('SUPPORT_ENGINEER')
});

export const createMemberSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters').trim(),
  email: z.string().email('Valid email address is required').toLowerCase().trim(),
  password: z.string().min(6, 'Password must be at least 6 characters'),
  role: z.string().trim().min(2).default('SUPPORT_ENGINEER'),
  customRole: z.string().optional().nullable(),
  avatarUrl: z.string().optional().nullable()
});

export const updateMemberSchema = z.object({
  name: z.string().min(2).optional(),
  email: z.string().email().toLowerCase().optional(),
  role: z.string().trim().min(2).optional(),
  customRole: z.string().optional().nullable(),
  isActive: z.boolean().optional(),
  password: z.string().min(6).optional().or(z.literal('')),
  avatarUrl: z.string().nullable().optional()
});
