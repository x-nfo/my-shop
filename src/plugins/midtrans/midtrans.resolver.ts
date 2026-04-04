import { Resolver, Mutation, Context } from '@nestjs/graphql';
import { RequestContext, Ctx, Allow, Permission } from '@vendure/core';
import { MidtransService } from './midtrans.service';

@Resolver()
export class MidtransShopResolver {
  constructor(private midtransService: MidtransService) {}

  @Mutation()
  @Allow(Permission.Public)
  async createMidtransPaymentIntent(@Ctx() ctx: RequestContext) {
    return this.midtransService.createPaymentIntent(ctx);
  }
}
