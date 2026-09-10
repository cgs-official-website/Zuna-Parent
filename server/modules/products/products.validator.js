import { z } from 'zod';

export const createProductSchema = z.object({
  title: z.string().min(2, 'Title must be at least 2 characters').trim(),
  category: z.string().min(2, 'Category is required').trim(),
  badgeColor: z.string().optional().nullable(),
  description: z.string().optional().nullable(),
  tier: z.enum(['STARTER', 'PRO', 'ENTERPRISE']).default('STARTER'),
  demoUrl: z.string().optional().nullable(),
  productUrl: z.string().optional().nullable(), // Frontend compatibility alias
  url: z.string().optional().nullable(), // Frontend compatibility alias
  iconKey: z.string().optional().nullable(),
  featureTags: z.array(z.string()).default([]),
  isPublished: z.boolean().default(true),
  sortOrder: z.coerce.number().int().default(0)
});

export const updateProductSchema = createProductSchema.partial();
