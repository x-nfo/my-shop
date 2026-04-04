import {
    CreatePaymentResult,
    PaymentMethodHandler,
    SettlePaymentResult,
    SettlePaymentErrorResult,
} from '@vendure/core';
import { MANUAL_BANK_TRANSFER_HANDLER_CODE, manualBankTransferHandlerDescription } from './manual-bank-transfer.types';

/**
 * Payment method handler for manual bank transfers.
 *
 * This handler marks payment as 'Authorized' initially.
 * Settlement will be performed manually by an administrator
 * after verifying the transfer proof.
 */
export const manualBankTransferHandler = new PaymentMethodHandler({
    code: MANUAL_BANK_TRANSFER_HANDLER_CODE,
    description: manualBankTransferHandlerDescription,
    args: {
        bankDetails: {
            type: 'string',
            ui: { component: 'textarea-form-input' },
            label: [
                { languageCode: 'en' as any, value: 'Bank Account Details' },
                { languageCode: 'id' as any, value: 'Informasi Rekening Bank' },
            ],
        },
    },

    /**
     * When a customer selects manual transfer, we authorize the payment.
     * The order will then move to 'ArrangingPayment' or 'PaymentAuthorized' state
     * depending on the order state machine configuration.
     */
    createPayment: async (ctx, order, amount, args, metadata): Promise<CreatePaymentResult> => {
        return {
            amount: amount,
            state: 'Authorized' as const,
            transactionId: `manual-${order.code}-${Date.now()}`,
            metadata: {
                bankDetails: args.bankDetails,
            },
        };
    },

    /**
     * Settle the payment. This is usually called from the Admin API
     * via OrderService.settlePayment().
     */
    settlePayment: async (ctx, order, payment, args): Promise<SettlePaymentResult | SettlePaymentErrorResult> => {
        return { success: true };
    },
});
