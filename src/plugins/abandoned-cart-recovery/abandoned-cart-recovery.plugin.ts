import { PluginCommonModule, VendurePlugin } from '@vendure/core';
import { AbandonedCartRecoveryOptions } from './abandoned-cart-recovery.types';
import { AbandonedCartRecoveryService } from './abandoned-cart-recovery.service';

const abandonedCartFieldDefinitions = [
    {
        name: 'abandonedCartRecoveryToken',
        type: 'string',
        nullable: true,
        public: false,
    },
    {
        name: 'abandonedCartRecoveryLastSentAt',
        type: 'datetime',
        nullable: true,
        public: false,
    },
    {
        name: 'abandonedCartRecoveryEmailCount',
        type: 'int',
        defaultValue: 0,
        public: false,
    },
] as const;

function mergeOrderCustomFields(existingFields: any[] = []): any[] {
    const existingNames = new Set(existingFields.map(f => f.name));
    const missing = abandonedCartFieldDefinitions.filter(f => !existingNames.has(f.name));
    return [...existingFields, ...missing];
}

@VendurePlugin({
    imports: [PluginCommonModule],
    providers: [AbandonedCartRecoveryService],
    configuration: (config) => {
        const customFields = config.customFields ?? {};
        config.customFields = {
            ...customFields,
            Order: mergeOrderCustomFields(customFields.Order),
        };
        return config;
    },
})
export class AbandonedCartRecoveryPlugin {
    static options: AbandonedCartRecoveryOptions;

    /**
     * @description
     * Initialize the plugin with the given options.
     */
    static init(options: Partial<AbandonedCartRecoveryOptions>) {
        this.options = {
            enabled: true,
            abandonAfterHours: 24,
            maxEmailsPerOrder: 1,
            eligibleStates: ['ArrangingPayment', 'ArrangingAdditionalPayment', 'AddingItems'],
            ...options,
        };
        return AbandonedCartRecoveryPlugin;
    }
}
