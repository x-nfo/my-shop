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
    serverKey: { 
      type: 'string',
      ui: { component: 'password-form-input' }
    },
    clientKey: { 
      type: 'string',
      ui: { component: 'password-form-input' }
    },
    isProduction: { type: 'boolean' },
    redirectUrl: { 
      type: 'string', 
      description: [{ languageCode: LanguageCode.en, value: 'Storefront checkout success URL' }] 
    },
  },

  createPayment: async (ctx, order, amount, args, metadata): Promise<CreatePaymentResult> => {
    const snap = new Snap({
      isProduction: args.isProduction,
      serverKey: args.serverKey,
      clientKey: args.clientKey,
    });

    try {
      const payload: any = {
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
      };

      const redirectUrl = args.redirectUrl || 'http://localhost:5173/order/success/[KODE_ORDER]';
      const parsedRedirectUrl = redirectUrl.replace('[KODE_ORDER]', order.code);
      
      payload.callbacks = {
        finish: parsedRedirectUrl,
        unfinish: parsedRedirectUrl,
        error: parsedRedirectUrl,
      };

      const transaction = await snap.createTransaction(payload);

      return {
        amount: order.total,
        state: 'Authorized' as const,
        transactionId: transaction.token, // Store SNAP token as transactionId
        metadata: {
          token: transaction.token,
          redirect_url: transaction.redirect_url,
          public: {
             redirect_url: transaction.redirect_url,
             token: transaction.token, // Expose token to storefront for Snap JS popup
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
