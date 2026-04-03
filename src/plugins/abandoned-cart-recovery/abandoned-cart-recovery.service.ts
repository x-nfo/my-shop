import { Injectable } from '@nestjs/common';
import {
    Order,
    RequestContext,
    TransactionalConnection,
    EventBus,
    Logger,
} from '@vendure/core';
import { In, LessThanOrEqual } from 'typeorm';
import { AbandonedCartRecoveryPlugin } from './abandoned-cart-recovery.plugin';
import { AbandonedCartRecoveryEvent } from './abandoned-cart-recovery.event';
import crypto from 'crypto';

type RecoveryScanSummary = {
    scannedCount: number;
    eligibleCount: number;
    queuedCount: number;
    skippedNoEmail: number;
    skippedEmptyCart: number;
};

@Injectable()
export class AbandonedCartRecoveryService {
    constructor(
        private connection: TransactionalConnection,
        private eventBus: EventBus,
    ) {}

    /**
     * @description
     * Finds orders that are eligible for abandoned cart recovery.
     */
    async findEligibleOrders(ctx: RequestContext) {
        const options = AbandonedCartRecoveryPlugin.options ?? {
            enabled: true,
            abandonAfterHours: 24,
            maxEmailsPerOrder: 1,
            eligibleStates: ['ArrangingPayment', 'ArrangingAdditionalPayment', 'AddingItems'],
        };
        const abandonDate = new Date();
        abandonDate.setHours(abandonDate.getHours() - options.abandonAfterHours);

        return this.connection.getRepository(ctx, Order).find({
            where: {
                active: true,
                updatedAt: LessThanOrEqual(abandonDate),
                state: In(options.eligibleStates),
                customFields: {
                    abandonedCartRecoveryEmailCount: LessThanOrEqual(options.maxEmailsPerOrder - 1),
                },
            },
            relations: ['customer', 'lines', 'lines.productVariant'],
        });
    }

    /**
     * @description
     * Builds a recovery URL for the given order & token.
     * This will be used in the recovery email.
     */
    buildRecoveryUrl(order: Order, token: string): string {
        // The storefront URL should be configurable, for now we assume a standard path.
        return `http://localhost:5173/checkout/recovery?token=${token}&orderCode=${order.code}`;
    }

    /**
     * @description
     * Marks an order as having had a recovery email sent.
     */
    async markRecoveryEmailSent(ctx: RequestContext, order: Order) {
        order.customFields.abandonedCartRecoveryLastSentAt = new Date();
        order.customFields.abandonedCartRecoveryEmailCount = (order.customFields.abandonedCartRecoveryEmailCount ?? 0) + 1;
        await this.connection.getRepository(ctx, Order).save(order);
    }

    /**
     * @description
     * Scans for eligible orders and queues them for recovery.
     */
    async scanAndQueueRecovery(ctx: RequestContext) {
        const options = AbandonedCartRecoveryPlugin.options ?? {
            enabled: true,
            abandonAfterHours: 24,
            maxEmailsPerOrder: 1,
            eligibleStates: ['ArrangingPayment', 'ArrangingAdditionalPayment', 'AddingItems'],
        };
        if (!options.enabled) {
            Logger.info('Abandoned cart recovery is disabled; skipping scan', 'AbandonedCartRecoveryPlugin');
            return {
                scannedCount: 0,
                eligibleCount: 0,
                queuedCount: 0,
                skippedNoEmail: 0,
                skippedEmptyCart: 0,
            } satisfies RecoveryScanSummary;
        }

        const eligibleOrders = await this.findEligibleOrders(ctx);
        Logger.info(`Found ${eligibleOrders.length} eligible abandoned orders`, 'AbandonedCartRecoveryPlugin');

        const summary: RecoveryScanSummary = {
            scannedCount: eligibleOrders.length,
            eligibleCount: eligibleOrders.length,
            queuedCount: 0,
            skippedNoEmail: 0,
            skippedEmptyCart: 0,
        };

        for (const order of eligibleOrders) {
            if (!order.customer || !order.customer.emailAddress) {
                summary.skippedNoEmail++;
                continue;
            }
            if (order.lines.length === 0) {
                summary.skippedEmptyCart++;
                continue;
            }

            Logger.info(`Queuing recovery for order ${order.code} (Customer: ${order.customer.emailAddress})`, 'AbandonedCartRecoveryPlugin');

            // Persist a token so that follow-up flows (Issue 9.1 / Context 7) have a stable identifier.
            const token = order.customFields.abandonedCartRecoveryToken ?? this.generateToken();
            order.customFields.abandonedCartRecoveryToken = token;

            const recoveryUrl = this.buildRecoveryUrl(order, token);
            this.eventBus.publish(new AbandonedCartRecoveryEvent(ctx, order, recoveryUrl));
            await this.markRecoveryEmailSent(ctx, order);
            summary.queuedCount++;
        }

        return summary;
    }

    private generateToken(): string {
        return crypto.randomBytes(24).toString('hex');
    }
}
