import { Args, Mutation, Resolver } from '@nestjs/graphql';
import { Allow, Ctx, ID, Permission, RequestContext } from '@vendure/core';
import { ManualBankTransferService } from './manual-bank-transfer.service';

@Resolver()
export class ManualBankTransferAdminResolver {
    constructor(private manualBankTransferService: ManualBankTransferService) {}

    @Mutation()
    @Allow(Permission.UpdateOrder)
    async verifyManualTransferPayment(
        @Ctx() ctx: RequestContext,
        @Args() args: { orderId: ID; note?: string },
    ) {
        return this.manualBankTransferService.verifyManualTransferPayment(ctx, args.orderId, args.note);
    }

    @Mutation()
    @Allow(Permission.UpdateOrder)
    async rejectManualTransferProof(
        @Ctx() ctx: RequestContext,
        @Args() args: { orderId: ID; note?: string },
    ) {
        return this.manualBankTransferService.rejectManualTransferProof(ctx, args.orderId, args.note);
    }
}
