import { Args, Mutation, Resolver } from '@nestjs/graphql';
import { Allow, Ctx, Permission, RequestContext } from '@vendure/core';
import { ManualBankTransferService } from './manual-bank-transfer.service';

interface UploadLike {
    filename: string;
    mimetype: string;
    encoding: string;
    createReadStream: () => NodeJS.ReadableStream;
}

@Resolver()
export class ManualBankTransferShopResolver {
    constructor(private manualBankTransferService: ManualBankTransferService) {}

    @Mutation()
    @Allow(Permission.Authenticated)
    async submitManualTransferProof(
        @Ctx() ctx: RequestContext,
        @Args() args: { orderCode: string; file: Promise<UploadLike>; note?: string },
    ) {
        const file = await args.file;
        return this.manualBankTransferService.submitManualTransferProof(ctx, args.orderCode, file, args.note);
    }
}
