import { Controller, Post, Body, Req } from '@nestjs/common';
import {
  OrderService,
  PaymentService,
  RequestContext,
  RequestContextService,
  ChannelService,
  OrderStateTransitionError,
} from '@vendure/core';
import { Request } from 'express';

@Controller('midtrans')
export class MidtransController {
  constructor(
    private orderService: OrderService,
    private paymentService: PaymentService,
    private requestContextService: RequestContextService,
    private channelService: ChannelService,
  ) {}

  @Post('notification')
  async handleNotification(@Req() req: Request, @Body() body: any) {
    // 1. Get transaction status from body
    // 2. Identify the Order code from order_id (format: CODE-TIMESTAMP)
    const orderIdParts = body.order_id.split('-');
    const orderCode = orderIdParts[0];

    // 3. Create RequestContext (needed for Vendure services)
    const ctx = await this.createContext(req);

    // 4. Find the Order
    const order = await this.orderService.findOneByCode(ctx, orderCode);
    if (!order) {
      console.error(`Order not found for code: ${orderCode}`);
      return;
    }

    // 5. Check transaction status
    const status = body.transaction_status;
    const fraud = body.fraud_status;

    if (status === 'capture') {
      if (fraud === 'challenge') {
        // Handle fraud challenge (optional)
      } else if (fraud === 'accept') {
        await this.settleOrderPayment(ctx, order.id);
      }
    } else if (status === 'settlement') {
      await this.settleOrderPayment(ctx, order.id);
    } else if (status === 'cancel' || status === 'deny' || status === 'expire') {
      // Handle payment failure (e.g., transition to Declined if Vendure state allows)
    }

    return { status: 'OK' };
  }

  private async settleOrderPayment(ctx: RequestContext, orderId: any) {
    const order = await this.orderService.findOne(ctx, orderId, ['payments']);
    if (!order) return;

    // Find the payment associated with this order (usually the latest Authorized one)
    const payment = order.payments.find(p => p.state === 'Authorized');
    if (payment) {
      await this.orderService.settlePayment(ctx, payment.id);
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
