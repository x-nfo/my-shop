import { EmailEventListener } from '@vendure/email-plugin';
import { AbandonedCartRecoveryEvent } from './abandoned-cart-recovery.event';
import { AbandonedCartRecoveryPlugin } from './abandoned-cart-recovery.plugin';

/**
 * @description
 * Email handler for the AbandonedCartRecoveryEvent.
 */
export const abandonedCartRecoveryHandler = new EmailEventListener('abandoned-cart-recovery')
    .on(AbandonedCartRecoveryEvent)
    .setRecipient(event => event.order.customer?.emailAddress || '')
    .setFrom('{{ fromAddress }}')
    .setSubject('Lupa sesuatu? Selesaikan pesanan Anda di My Shop!')
    .setTemplateVars(event => {
        const { order, recoveryUrl } = event;
        const options = AbandonedCartRecoveryPlugin.options;
        const firstName = order.customer?.firstName || '';
        const lastName = order.customer?.lastName || '';
        const itemCount = order.lines.reduce((total, line) => total + line.quantity, 0);

        return {
            firstName,
            lastName,
            orderCode: order.code,
            recoveryUrl,
            itemCount,
            abandonedHours: options.abandonAfterHours,
        };
    });
