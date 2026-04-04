import { Injectable, Logger } from '@nestjs/common';
import {
  RequestContext,
  OrderService,
  ActiveOrderService,
  PaymentMethodService,
} from '@vendure/core';
import { midtransPaymentHandler } from './midtrans.handler';
// @ts-ignore
import { Snap } from 'midtrans-client';

@Injectable()
export class MidtransService {
  constructor(
    private orderService: OrderService,
    private activeOrderService: ActiveOrderService,
    private paymentMethodService: PaymentMethodService,
  ) {}

  async createPaymentIntent(ctx: RequestContext) {
    const order = await this.activeOrderService.getActiveOrder(ctx, undefined);
    if (!order) {
      throw new Error('No active order found');
    }

    const paymentMethod = await this.paymentMethodService.findAll(ctx).then(res => 
      res.items.find(pm => pm.handler.code === midtransPaymentHandler.code)
    );

    if (!paymentMethod) {
      throw new Error('Midtrans payment method not found');
    }

    const serverKey = paymentMethod.handler.args.find(a => a.name === 'serverKey')?.value;
    const clientKey = paymentMethod.handler.args.find(a => a.name === 'clientKey')?.value;
    const isProduction = paymentMethod.handler.args.find(a => a.name === 'isProduction')?.value === 'true';

    const snap = new Snap({
      isProduction,
      serverKey,
      clientKey,
    });

    const payload: any = {
      transaction_details: {
        order_id: `${order.code}-${Date.now()}`,
        gross_amount: order.totalWithTax,
      },
      customer_details: {
        first_name: order.customer?.firstName,
        last_name: order.customer?.lastName,
        email: order.customer?.emailAddress,
        phone: order.customer?.phoneNumber,
      },
      item_details: order.lines.map(line => ({
        id: line.productVariant.sku,
        price: line.unitPriceWithTax,
        quantity: line.quantity,
        name: line.productVariant.name,
      })),
    };

    if (order.shippingWithTax > 0) {
      payload.item_details.push({
        id: 'SHIPPING',
        price: order.shippingWithTax,
        quantity: 1,
        name: 'Shipping Cost',
      });
    }

    const transaction = await snap.createTransaction(payload);
    Logger.info(`Created Midtrans payment intent for order ${order.code}`, 'MidtransPlugin');

    return transaction.token;
  }
}
