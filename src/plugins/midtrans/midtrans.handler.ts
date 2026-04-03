import {
  CancelPaymentResult,
  CreatePaymentResult,
  LanguageCode,
  PaymentMethodHandler,
  SettlePaymentResult,
  SettlePaymentErrorResult,
} from '@vendure/core';
// @ts-ignore
import { Snap } from 'midtrans-client';

export const midtransPaymentHandler = new PaymentMethodHandler({
  code: 'midtrans',
  description: [
    {
      languageCode: LanguageCode.en,
      value: 'Midtrans Payment Gateway',
    },
    {
      languageCode: LanguageCode.id,
      value: 'Pembayaran Midtrans',
    },
  ],
  args: {
    serverKey: { type: 'string' },
    clientKey: { type: 'string' },
    isProduction: { type: 'boolean' },
  },

  createPayment: async (ctx, order, amount, args, metadata): Promise<CreatePaymentResult> => {
    const snap = new Snap({
      isProduction: args.isProduction,
      serverKey: args.serverKey,
      clientKey: args.clientKey,
    });

    try {
      const transaction = await snap.createTransaction({
        transaction_details: {
          order_id: `${order.code}-${Date.now()}`,
          gross_amount: amount,
        },
        customer_details: {
          first_name: order.customer?.firstName,
          last_name: order.customer?.lastName,
          email: order.customer?.emailAddress,
          phone: order.customer?.phoneNumber,
        },
      });

      return {
        amount: order.total,
        state: 'Authorized' as const,
        transactionId: transaction.token, // Store SNAP token as transactionId
        metadata: {
          token: transaction.token,
          redirect_url: transaction.redirect_url,
          public: {
             redirect_url: transaction.redirect_url,
          }
        },
      };
    } catch (err: any) {
      return {
        amount: order.total,
        state: 'Declined' as const,
        metadata: {
          errorMessage: err.message,
        },
      };
    }
  },

  settlePayment: async (ctx, order, payment, args): Promise<SettlePaymentResult | SettlePaymentErrorResult> => {
    // Settlement is usually handled via the webhook controller
    return { success: true };
  },
});
