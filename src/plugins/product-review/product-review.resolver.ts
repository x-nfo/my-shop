import { Args, Mutation, Query, Resolver, ResolveField, Parent } from '@nestjs/graphql';
import {
    Allow,
    Ctx,
    ID,
    Permission,
    RequestContext,
    Product,
    PaginatedList,
    ForbiddenError,
} from '@vendure/core';
import { ProductReviewService } from './product-review.service';
import { ProductReview } from './product-review.entity';

@Resolver()
export class ProductReviewShopResolver {
    constructor(private productReviewService: ProductReviewService) {}

    @Mutation()
    @Allow(Permission.Authenticated)
    async submitProductReview(
        @Ctx() ctx: RequestContext,
        @Args('input') input: { productId: ID; rating: number; text: string },
    ): Promise<ProductReview> {
        const userId = ctx.activeUserId;
        if (!userId) {
            throw new ForbiddenError();
        }
        return this.productReviewService.submitReviewByUserId(ctx, userId, input.productId, input.rating, input.text);
    }

    @Query()
    @Allow(Permission.Public)
    async productReviews(
        @Ctx() ctx: RequestContext,
        @Args() args: { productId: ID; options: any },
    ): Promise<PaginatedList<ProductReview>> {
        return this.productReviewService.findPublicByProductId(ctx, args.productId, args.options);
    }
}

@Resolver('Product')
export class ProductReviewEntityResolver {
    constructor(private productReviewService: ProductReviewService) {}

    @ResolveField()
    @Allow(Permission.Public)
    async averageRating(@Ctx() ctx: RequestContext, @Parent() product: Product): Promise<number> {
        return this.productReviewService.getAverageRating(ctx, product.id);
    }

    @ResolveField()
    @Allow(Permission.Public)
    async reviewCount(@Ctx() ctx: RequestContext, @Parent() product: Product): Promise<number> {
        return this.productReviewService.getReviewCount(ctx, product.id);
    }
}
