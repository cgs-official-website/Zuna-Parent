import { z } from 'zod';

export const listTicketsQuerySchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(20),
  status: z.enum(['OPEN', 'IN_PROGRESS', 'RESOLVED', 'CLOSED', 'all']).optional(),
  priority: z.enum(['LOW', 'MEDIUM', 'HIGH', 'URGENT', 'all']).optional(),
  product: z.string().optional(),
  assignedAdminId: z.string().optional(),
  search: z.string().optional()
});

export const updateTicketSchema = z.object({
  status: z.enum(['OPEN', 'IN_PROGRESS', 'RESOLVED', 'CLOSED']).optional(),
  priority: z.enum(['LOW', 'MEDIUM', 'HIGH', 'URGENT']).optional(),
  assignedAdminId: z.string().nullable().optional()
}).refine((data) => Object.keys(data).length > 0, {
  message: 'At least one field (status, priority, or assignedAdminId) must be provided'
});

export const createMessageSchema = z.object({
  text: z.string().min(1, 'Message text cannot be empty').trim()
});

export const exportTicketsQuerySchema = z.object({
  format: z.enum(['csv', 'pdf']).default('csv'),
  status: z.enum(['OPEN', 'IN_PROGRESS', 'RESOLVED', 'CLOSED', 'all']).optional(),
  priority: z.enum(['LOW', 'MEDIUM', 'HIGH', 'URGENT', 'all']).optional(),
  product: z.string().optional(),
  assignedAdminId: z.string().optional(),
  search: z.string().optional()
});
