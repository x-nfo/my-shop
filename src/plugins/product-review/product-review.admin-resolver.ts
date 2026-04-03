import { Args, Mutation, Query, Resolver } from '@nestjs/graphql';
import {
    Allow,
    Ctx,
    ID,
    Permission,
    RequestContext,
    PaginatedList,
} from '@vendure/core';
import { ProductReviewService } from './product-review.service';
import { ProductReview } from './product-review.entity';

@Resolver()
export class ProductReviewAdminResolver {
    constructor(private productReviewService: ProductReviewService) {}

    @Query()
    @Allow(Permission.ReadCatalog)
    async productReviews(
        @Ctx() ctx: RequestContext,
        @Args() args: { options: any },
    ): Promise<PaginatedList<ProductReview>> {
        return this.productReviewService.findAll(ctx, args.options);
    }

    @Query()
    @Allow(Permission.ReadCatalog)
    async productReviewsForModeration(
        @Ctx() ctx: RequestContext,
        @Args() args: { options: any },
    ): Promise<PaginatedList<ProductReview>> {
        return this.productReviewService.findForModeration(ctx, args.options);
    }

    @Mutation()
    @Allow(Permission.UpdateCatalog)
    async approveProductReview(
        @Ctx() ctx: RequestContext,
        @Args('id') id: ID,
        @Args('note') note?: string,
    ): Promise<ProductReview> {
        return this.productReviewService.approve(ctx, id, note);
    }

    @Mutation()
    @Allow(Permission.UpdateCatalog)
    async rejectProductReview(
        @Ctx() ctx: RequestContext,
        @Args('id') id: ID,
        @Args('note') note?: string,
    ): Promise<ProductReview> {
        return this.productReviewService.reject(ctx, id, note);
    }
}
