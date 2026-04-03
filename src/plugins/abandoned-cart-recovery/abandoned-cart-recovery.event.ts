import { Order, RequestContext, VendureEvent } from '@vendure/core';

/**
 * @description
 * This event is fired when an abandoned cart recovery email should be sent.
 */
export class AbandonedCartRecoveryEvent extends VendureEvent {
    constructor(
        public ctx: RequestContext,
        public order: Order,
        public recoveryUrl: string,
    ) {
        super();
    }
}
