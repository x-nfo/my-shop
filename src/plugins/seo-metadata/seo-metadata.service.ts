import { Injectable, Inject } from '@nestjs/common';
import { CollectionService, ProductService, RequestContext } from '@vendure/core';
import { SeoMetadataPayload, SeoMetadataPluginOptions, SEO_METADATA_PLUGIN_OPTIONS } from './seo-metadata.types';

type SeoEntityInput = {
    name?: string | null;
    description?: string | null;
    featuredAsset?: {
        preview?: string | null;
    } | null;
    customFields?: unknown;
};

@Injectable()
export class SeoMetadataService {
    constructor(
        private readonly productService: ProductService,
        private readonly collectionService: CollectionService,
        @Inject(SEO_METADATA_PLUGIN_OPTIONS) private readonly options: Required<SeoMetadataPluginOptions>,
    ) {}

    async getProductSeoBySlug(ctx: RequestContext, slug: string): Promise<SeoMetadataPayload | null> {
        const product = await this.productService.findOneBySlug(ctx, slug, ['featuredAsset']);
        if (!product) {
            return null;
        }
        return this.buildSeoPayload(product);
    }

    async getCollectionSeoBySlug(ctx: RequestContext, slug: string): Promise<SeoMetadataPayload | null> {
        const collection = await this.collectionService.findOneBySlug(ctx, slug, ['featuredAsset']);
        if (!collection) {
            return null;
        }
        return this.buildSeoPayload(collection);
    }

    buildSeoPayload(entity: SeoEntityInput): SeoMetadataPayload {
        const customFields = this.toRecord(entity.customFields);

        const fallbackTitle = (entity.name ?? '').trim();
        const fallbackDescription = (entity.description ?? '').trim();

        const title = this.pickNonEmpty(customFields.seoTitle, fallbackTitle);
        const description = this.pickNonEmpty(customFields.seoDescription, fallbackDescription);
        const ogImageUrl = this.pickOptionalNonEmpty(
            customFields.seoOgImageUrl,
            entity.featuredAsset?.preview,
            this.options.defaultOgImageUrl,
        );

        return {
            title: title ?? '',
            description: description ?? '',
            ogImageUrl,
        };
    }

    private toRecord(value: unknown): Record<string, unknown> {
        if (value && typeof value === 'object') {
            return value as Record<string, unknown>;
        }
        return {};
    }

    private pickNonEmpty(...values: unknown[]): string | undefined {
        for (const value of values) {
            const normalized = this.normalizeString(value);
            if (normalized) {
                return normalized;
            }
        }
        return undefined;
    }

    private pickOptionalNonEmpty(...values: unknown[]): string | null {
        return this.pickNonEmpty(...values) ?? null;
    }

    private normalizeString(value: unknown): string | undefined {
        if (typeof value !== 'string') {
            return undefined;
        }
        const trimmed = value.trim();
        return trimmed.length > 0 ? trimmed : undefined;
    }
}
