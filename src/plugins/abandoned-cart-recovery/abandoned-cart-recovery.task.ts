import { ScheduledTask } from '@vendure/core';
import { AbandonedCartRecoveryService } from './abandoned-cart-recovery.service';

/**
 * @description
 * Scheduled task to scan for abandoned carts and trigger recovery emails.
 * Runs every hour.
 */
export const abandonedCartRecoveryScanTask = new ScheduledTask({
    id: 'abandoned-cart-recovery-scan',
    schedule: cron => cron.everyHour(),
    execute: ({ injector, scheduledContext }) => {
        const service = injector.get(AbandonedCartRecoveryService);
        return service.scanAndQueueRecovery(scheduledContext);
    },
});
