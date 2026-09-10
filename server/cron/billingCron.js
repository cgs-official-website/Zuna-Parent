import cron from 'node-cron';
import { BillingService } from '../modules/billing/billing.service.js';
import { logger } from '../lib/logger.js';

let cronTask = null;

/**
 * Initialize daily billing scheduled task (Runs at 00:00 UTC daily)
 */
export function startBillingCron() {
  // Pattern: '0 0 * * *' = every day at midnight
  cronTask = cron.schedule('0 0 * * *', async () => {
    logger.info('⏰ Running daily billing cron job for subscription renewals...');
    try {
      const result = await BillingService.processSubscriptionRenewals();
      logger.info({ processed: result.processedCount }, 'Daily billing cron job completed successfully');
    } catch (err) {
      logger.error({ err: err.message }, 'Error executing daily billing cron job');
    }
  });

  logger.info('Scheduled daily billing cron job (00:00 midnight)');
  return cronTask;
}

export function stopBillingCron() {
  if (cronTask) {
    cronTask.stop();
    logger.info('Stopped daily billing cron job');
  }
}
