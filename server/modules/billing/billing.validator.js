import { z } from 'zod';

export const createSubscriptionSchema = z.object({
  clientCompanyName: z.string().min(2, 'Company name is required').trim(),
  productId: z.string().min(1, 'Product ID is required'),
  tier: z.enum(['STARTER', 'PRO', 'ENTERPRISE']).default('STARTER'),
  monthlyAmountPaise: z.coerce.number().int().positive('Monthly amount must be a positive integer in paise'),
  status: z.enum(['ACTIVE', 'PAST_DUE', 'CANCELED', 'TRIALING']).default('TRIALING'),
  currentPeriodStart: z.string().datetime({ offset: true }).optional(),
  currentPeriodEnd: z.string().datetime({ offset: true }).optional()
});

export const updateSubscriptionSchema = z.object({
  clientCompanyName: z.string().min(2).optional(),
  productId: z.string().optional(),
  tier: z.enum(['STARTER', 'PRO', 'ENTERPRISE']).optional(),
  monthlyAmountPaise: z.coerce.number().int().positive().optional(),
  status: z.enum(['ACTIVE', 'PAST_DUE', 'CANCELED', 'TRIALING']).optional(),
  currentPeriodStart: z.string().datetime({ offset: true }).optional(),
  currentPeriodEnd: z.string().datetime({ offset: true }).optional()
});

export const createInvoiceSchema = z.object({
  subscriptionId: z.string().min(1, 'Subscription ID is required'),
  amountPaise: z.coerce.number().int().positive('Amount must be positive integer paise'),
  dueAt: z.string().datetime({ offset: true }).optional(),
  status: z.enum(['PENDING', 'PAID', 'OVERDUE', 'VOID']).default('PENDING')
});

export const updateInvoiceSchema = z.object({
  amountPaise: z.coerce.number().int().positive().optional(),
  status: z.enum(['PENDING', 'PAID', 'OVERDUE', 'VOID']).optional(),
  dueAt: z.string().datetime({ offset: true }).optional(),
  paidAt: z.string().datetime({ offset: true }).nullable().optional()
});

export const querySubscriptionsSchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(20),
  status: z.enum(['ACTIVE', 'PAST_DUE', 'CANCELED', 'TRIALING', 'all']).optional(),
  productId: z.string().optional(),
  search: z.string().optional()
});

export const queryInvoicesSchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(20),
  status: z.enum(['PENDING', 'PAID', 'OVERDUE', 'VOID', 'all']).optional(),
  subscriptionId: z.string().optional()
});
