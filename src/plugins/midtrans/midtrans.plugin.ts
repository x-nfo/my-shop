import { VendurePlugin, PluginCommonModule } from '@vendure/core';
import { midtransPaymentHandler } from './midtrans.handler';
import { MidtransController } from './midtrans.controller';

@VendurePlugin({
  imports: [PluginCommonModule],
  controllers: [MidtransController],
  configuration: config => {
    config.paymentOptions.paymentMethodHandlers.push(midtransPaymentHandler);
    return config;
  },
  compatibility: '^3.0.0',
})
export class MidtransPlugin {}
