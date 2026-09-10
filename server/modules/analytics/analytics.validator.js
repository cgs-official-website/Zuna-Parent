import { z } from 'zod';

export const chartsQuerySchema = z.object({
  range: z.enum(['7d', '30d', '90d']).default('7d')
});
