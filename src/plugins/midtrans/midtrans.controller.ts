import { Controller, Post, Body, Req, Logger } from '@nestjs/common';
import {
  OrderService,
  PaymentMethodService,
  RequestContext,
  RequestContextService,
  ChannelService,
} from '@vendure/core';
import { Request } from 'express';
import { midtransPaymentHandler } from './midtrans.handler';
import crypto from 'crypto';

@Controller('midtrans')
export class MidtransController {
  constructor(
    private orderService: OrderService,
    private paymentMethodService: PaymentMethodService,
    private requestContextService: RequestContextService,
    private channelService: ChannelService,
  ) { }

  @Post('notification')
  async handleNotification(@Req() req: Request, @Body() body: any) {
    const ctx = await this.createContext(req);
    
    // 1. Verify Signature
    const isVerified = await this.verifySignature(ctx, body);
    if (!isVerified) {
      Logger.error('Midtrans notification signature verification failed', 'MidtransPlugin');
      return { status: 'Error', message: 'Invalid signature' };
    }

    // 2. Identify the Order code from order_id (format: CODE-TIMESTAMP)
    const orderIdParts = body.order_id.split('-');
    const orderCode = orderIdParts[0];

    // 3. Find the Order
    const order = await this.orderService.findOneByCode(ctx, orderCode);
    if (!order) {
      Logger.error(`Order not found for code: ${orderCode}`, 'MidtransPlugin');
      return { status: 'Error', message: 'Order not found' };
    }

    // 4. Handle statuses
    const status = body.transaction_status;
    const fraud = body.fraud_status;

    Logger.info(`Handling Midtrans notification for order ${orderCode}: status=${status}, fraud=${fraud}`, 'MidtransPlugin');

    if (status === 'capture') {
      if (fraud === 'challenge') {
        // Handle fraud challenge (optional)
      } else if (fraud === 'accept') {
        await this.settleOrderPayment(ctx, order.id);
      }
    } else if (status === 'settlement') {
      await this.settleOrderPayment(ctx, order.id);
    } else if (status === 'cancel' || status === 'deny' || status === 'expire') {
      await this.cancelOrderPayment(ctx, order.id);
    }

    return { status: 'OK' };
  }

  private async verifySignature(ctx: RequestContext, body: any): Promise<boolean> {
    const paymentMethod = await this.paymentMethodService.findAll(ctx).then(res => 
      res.items.find(pm => pm.handler.code === midtransPaymentHandler.code)
    );

    if (!paymentMethod) return false;

    const serverKey = paymentMethod.handler.args.find(a => a.name === 'serverKey')?.value;
    if (!serverKey) return false;

    const { order_id, status_code, gross_amount, signature_key } = body;
    const payload = order_id + status_code + gross_amount + serverKey;
    const hash = crypto.createHash('sha512').update(payload).digest('hex');

    return hash === signature_key;
  }

  private async settleOrderPayment(ctx: RequestContext, orderId: any) {
    const order = await this.orderService.findOne(ctx, orderId, ['payments']);
    if (!order) return;

    // Find the payment associated with this order
    const payment = order.payments.find(p => p.state === 'Authorized' || p.state === 'Created');
    if (payment) {
      await this.orderService.settlePayment(ctx, payment.id);
      Logger.info(`Settled payment ${payment.id} for order ${order.code}`, 'MidtransPlugin');
    }
  }

  private async cancelOrderPayment(ctx: RequestContext, orderId: any) {
    const order = await this.orderService.findOne(ctx, orderId, ['payments']);
    if (!order) return;

    const payments = order.payments.filter(p => !['Settled', 'Declined', 'Cancelled'].includes(p.state));
    for (const payment of payments) {
      Logger.warn(`Payment ${payment.id} for order ${order.code} was denied/cancelled/expired`, 'MidtransPlugin');
    }
  }

  private async createContext(req: Request): Promise<RequestContext> {
    const channel = await this.channelService.getDefaultChannel();
    return this.requestContextService.create({
      apiType: 'admin',
      channelOrToken: channel,
      user: undefined,
    });
  }
}
