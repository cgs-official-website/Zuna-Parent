import { z } from 'zod';

const roleSchema = z.string().transform((val) => {
  const normalized = val.toUpperCase().replace(/\s+/g, '_');
  const validRoles = ['SUPER_ADMIN', 'SUPPORT_LEAD', 'SUPPORT_ENGINEER', 'PRODUCT_MANAGER'];
  if (validRoles.includes(normalized)) return normalized;
  return 'SUPPORT_ENGINEER';
});

export const createMemberSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters').trim(),
  email: z.string().email('Valid email address is required').toLowerCase().trim(),
  password: z.string().min(6, 'Password must be at least 6 characters'),
  role: roleSchema.default('SUPPORT_ENGINEER'),
  avatarUrl: z.string().optional().nullable()
});

export const updateMemberSchema = z.object({
  name: z.string().min(2).optional(),
  email: z.string().email().toLowerCase().optional(),
  role: roleSchema.optional(),
  isActive: z.boolean().optional(),
  password: z.string().min(6).optional(),
  avatarUrl: z.string().nullable().optional()
});
