import { Args, Parent, Query, ResolveField, Resolver } from '@nestjs/graphql';
import { Allow, Ctx, Permission, RequestContext } from '@vendure/core';
import { SeoMetadataService } from './seo-metadata.service';
import { SeoMetadataPayload } from './seo-metadata.types';

type SeoParent = {
    name?: string | null;
    description?: string | null;
    featuredAsset?: {
        preview?: string | null;
    } | null;
    customFields?: unknown;
};

@Resolver('Product')
export class ProductSeoResolver {
    constructor(private readonly seoMetadataService: SeoMetadataService) {}

    @ResolveField()
    @Allow(Permission.Public)
    seo(@Ctx() _ctx: RequestContext, @Parent() product: SeoParent): SeoMetadataPayload {
        return this.seoMetadataService.buildSeoPayload(product);
    }
}

@Resolver('Collection')
export class CollectionSeoResolver {
    constructor(private readonly seoMetadataService: SeoMetadataService) {}

    @ResolveField()
    @Allow(Permission.Public)
    seo(@Ctx() _ctx: RequestContext, @Parent() collection: SeoParent): SeoMetadataPayload {
        return this.seoMetadataService.buildSeoPayload(collection);
    }
}

@Resolver()
export class SeoMetadataShopResolver {
    constructor(private readonly seoMetadataService: SeoMetadataService) {}

    @Query()
    @Allow(Permission.Public)
    async seoMetadataForProduct(
        @Ctx() ctx: RequestContext,
        @Args('slug') slug: string,
    ): Promise<SeoMetadataPayload | null> {
        return this.seoMetadataService.getProductSeoBySlug(ctx, slug);
    }

    @Query()
    @Allow(Permission.Public)
    async seoMetadataForCollection(
        @Ctx() ctx: RequestContext,
        @Args('slug') slug: string,
    ): Promise<SeoMetadataPayload | null> {
        return this.seoMetadataService.getCollectionSeoBySlug(ctx, slug);
    }
}

