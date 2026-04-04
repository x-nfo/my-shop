import { Asset, CustomFieldConfig, LanguageCode, PluginCommonModule, VendurePlugin } from '@vendure/core';
import { manualBankTransferHandler } from './manual-bank-transfer.handler';
import { ManualBankTransferService } from './manual-bank-transfer.service';
import { ManualBankTransferShopResolver } from './manual-bank-transfer.shop-resolver';
import { ManualBankTransferAdminResolver } from './manual-bank-transfer.admin-resolver';
import { adminApiExtensions, shopApiExtensions } from './schema';

const manualTransferOrderCustomFields: CustomFieldConfig[] = [
    {
        name: 'manualTransferProofAsset',
        type: 'relation',
        entity: Asset,
        public: true,
        nullable: true,
        label: [
            { languageCode: LanguageCode.en, value: 'Manual Transfer Proof' },
            { languageCode: LanguageCode.id, value: 'Bukti Transfer Manual' },
        ],
    },
    {
        name: 'manualTransferProofUploadedAt',
        type: 'datetime',
        public: true,
        nullable: true,
        label: [
            { languageCode: LanguageCode.en, value: 'Proof Uploaded At' },
            { languageCode: LanguageCode.id, value: 'Bukti Diunggah Pada' },
        ],
    },
    {
        name: 'manualTransferVerificationStatus',
        type: 'string',
        public: true,
        defaultValue: 'PENDING',
        label: [
            { languageCode: LanguageCode.en, value: 'Verification Status' },
            { languageCode: LanguageCode.id, value: 'Status Verifikasi' },
        ],
    },
    {
        name: 'manualTransferVerificationNote',
        type: 'text',
        public: true,
        nullable: true,
        label: [
            { languageCode: LanguageCode.en, value: 'Verification Note' },
            { languageCode: LanguageCode.id, value: 'Catatan Verifikasi' },
        ],
    },
    {
        name: 'manualTransferVerifiedAt',
        type: 'datetime',
        public: true,
        nullable: true,
        label: [
            { languageCode: LanguageCode.en, value: 'Verified At' },
            { languageCode: LanguageCode.id, value: 'Diverifikasi Pada' },
        ],
    },
];

function mergeOrderCustomFields(existingFields: CustomFieldConfig[] = []): CustomFieldConfig[] {
    const existingNames = new Set(existingFields.map(field => field.name));
    const missingFields = manualTransferOrderCustomFields.filter(field => !existingNames.has(field.name));
    return [...existingFields, ...missingFields];
}

@VendurePlugin({
    imports: [PluginCommonModule],
    providers: [ManualBankTransferService],
    configuration: (config) => {
        config.paymentOptions.paymentMethodHandlers.push(manualBankTransferHandler);
        const customFields = config.customFields ?? {};
        config.customFields = {
            ...customFields,
            Order: mergeOrderCustomFields(customFields.Order),
        };
        return config;
    },
    shopApiExtensions: {
        schema: shopApiExtensions,
        resolvers: [ManualBankTransferShopResolver],
    },
    adminApiExtensions: {
        schema: adminApiExtensions,
        resolvers: [ManualBankTransferAdminResolver],
    },
    dashboard: {
        location: './dashboard/index.tsx',
    },
    compatibility: '^3.0.0',
})
export class ManualBankTransferPlugin {}
