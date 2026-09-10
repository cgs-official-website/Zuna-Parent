import { z } from 'zod';

export const listNotificationsQuerySchema = z.object({
  unreadOnly: z
    .string()
    .optional()
    .transform((val) => val === 'true' || val === '1'),
  limit: z.coerce.number().int().positive().max(100).default(50)
});
