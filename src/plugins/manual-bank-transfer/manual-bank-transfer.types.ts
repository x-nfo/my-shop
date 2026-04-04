import { LanguageCode } from '@vendure/core';

export const MANUAL_BANK_TRANSFER_HANDLER_CODE = 'manual-bank-transfer';

export enum ManualTransferVerificationStatus {
    PENDING = 'PENDING',
    APPROVED = 'APPROVED',
    REJECTED = 'REJECTED',
}

export const manualBankTransferHandlerDescription = [
    {
        languageCode: LanguageCode.en,
        value: 'Manual Bank Transfer',
    },
    {
        languageCode: LanguageCode.id,
        value: 'Transfer Bank Manual',
    },
];
