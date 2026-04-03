import { VendurePlugin } from '@vendure/core';

/**
 * @description
 * Configuration options for the AbandonedCartRecoveryPlugin.
 */
export interface AbandonedCartRecoveryOptions {
    /**
     * @description
     * Whether the recovery system is enabled.
     * @default true
     */
    enabled: boolean;
    /**
     * @description
     * Number of hours after the last update to consider a cart abandoned.
     * @default 24
     */
    abandonAfterHours: number;
    /**
     * @description
     * Maximum number of recovery emails to send per order.
     * @default 1
     */
    maxEmailsPerOrder: number;
    /**
     * @description
     * Order states that are eligible for recovery.
     * @default ['ArrangingPayment', 'ArrangingAdditionalPayment', 'AddingItems']
     */
    eligibleStates: string[];
}

declare module '@vendure/core' {
    interface CustomOrderFields {
        abandonedCartRecoveryToken?: string;
        abandonedCartRecoveryLastSentAt?: Date;
        abandonedCartRecoveryEmailCount?: number;
    }
}
