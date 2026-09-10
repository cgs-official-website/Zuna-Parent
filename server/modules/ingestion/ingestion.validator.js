import { z } from 'zod';

const priorityTransformer = z
  .string()
  .optional()
  .transform((val) => {
    if (!val) return 'MEDIUM';
    const upper = val.toUpperCase();
    if (['LOW', 'MEDIUM', 'HIGH', 'URGENT'].includes(upper)) return upper;
    return 'MEDIUM';
  });

export const externalTicketSchema = z.object({
  clientName: z.string().min(2, 'Client name is required').trim(),
  clientEmail: z.string().email('Valid client email is required').toLowerCase().trim(),
  subject: z.string().min(3, 'Subject must be at least 3 characters').trim(),
  description: z.string().min(5, 'Description must be at least 5 characters').trim(),
  priority: priorityTransformer
});

export const webFormTicketSchema = z.object({
  clientName: z.string().min(2, 'Client name is required').trim(),
  clientEmail: z.string().email('Valid client email is required').toLowerCase().trim(),
  subject: z.string().min(3, 'Subject must be at least 3 characters').trim(),
  description: z.string().min(5, 'Description must be at least 5 characters').trim(),
  priority: priorityTransformer,
  productId: z.string().optional(),
  productNameSnapshot: z.string().optional(),
  _hp: z.string().optional() // Honeypot field for spam prevention
});
