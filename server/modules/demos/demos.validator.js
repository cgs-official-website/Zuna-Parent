import { z } from 'zod';

export const createDemoRequestSchema = z.object({
  contactName: z.string().optional(),
  name: z.string().optional(), // alias
  contactEmail: z.string().email('Valid email is required').optional(),
  email: z.string().email('Valid email is required').optional(), // alias
  companyName: z.string().optional(),
  company: z.string().optional(), // alias
  contactPhone: z.string().optional().nullable(),
  phone: z.string().optional().nullable(), // alias
  message: z.string().optional().nullable(),
  productId: z.string().optional().nullable(),
  product: z.string().optional().nullable() // product title or ID alias
}).refine((data) => data.contactName || data.name, {
  message: 'Contact name is required'
}).refine((data) => data.contactEmail || data.email, {
  message: 'Valid contact email is required'
});

export const updateDemoRequestSchema = z.object({
  status: z.enum(['NEW', 'CONTACTED', 'SCHEDULED', 'COMPLETED']).optional(),
  scheduledAt: z.string().datetime({ offset: true }).nullable().optional()
}).refine((data) => Object.keys(data).length > 0, {
  message: 'At least one field (status or scheduledAt) must be provided'
});

export const queryDemoRequestSchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(20),
  status: z.enum(['NEW', 'CONTACTED', 'SCHEDULED', 'COMPLETED', 'all']).optional(),
  productId: z.string().optional(),
  search: z.string().optional()
});
