import { VendurePlugin, PluginCommonModule } from '@vendure/core';
import { gql } from 'graphql-tag';
import { midtransPaymentHandler } from './midtrans.handler';
import { MidtransController } from './midtrans.controller';
import { MidtransService } from './midtrans.service';
import { MidtransShopResolver } from './midtrans.resolver';

const shopApiExtensions = gql`
  extend type Mutation {
    createMidtransPaymentIntent: String!
  }
`;

@VendurePlugin({
  imports: [PluginCommonModule],
  controllers: [MidtransController],
  providers: [MidtransService],
  shopApiExtensions: {
    schema: shopApiExtensions,
    resolvers: [MidtransShopResolver],
  },
  configuration: config => {
    config.paymentOptions.paymentMethodHandlers.push(midtransPaymentHandler);
    return config;
  },
  compatibility: '^3.0.0',
})
export class MidtransPlugin {}
