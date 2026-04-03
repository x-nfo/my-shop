import { CustomFieldConfig, LanguageCode, PluginCommonModule, VendurePlugin } from '@vendure/core';
import { CollectionSeoResolver, ProductSeoResolver, SeoMetadataShopResolver } from './seo-metadata.resolver';
import { SeoMetadataService } from './seo-metadata.service';
import { graphqlAdminSchema, graphqlShopSchema } from './schema';
import {
    defaultSeoMetadataPluginOptions,
    SeoMetadataPluginOptions,
    SEO_METADATA_PLUGIN_OPTIONS,
} from './seo-metadata.types';

const seoFieldDefinitions: CustomFieldConfig[] = [
    {
        name: 'seoTitle',
        type: 'string',
        nullable: true,
        label: [
            { languageCode: LanguageCode.en, value: 'SEO Title' },
            { languageCode: LanguageCode.id, value: 'Judul SEO' },
        ],
        description: [
            { languageCode: LanguageCode.en, value: 'Page title used for SEO snippets' },
            { languageCode: LanguageCode.id, value: 'Judul halaman untuk snippet SEO' },
        ],
    },
    {
        name: 'seoDescription',
        type: 'text',
        nullable: true,
        label: [
            { languageCode: LanguageCode.en, value: 'SEO Description' },
            { languageCode: LanguageCode.id, value: 'Deskripsi SEO' },
        ],
        description: [
            { languageCode: LanguageCode.en, value: 'Meta description shown in search engine results' },
            { languageCode: LanguageCode.id, value: 'Meta deskripsi yang tampil pada hasil pencarian' },
        ],
    },
    {
        name: 'seoOgImageUrl',
        type: 'string',
        length: 2048,
        nullable: true,
        label: [
            { languageCode: LanguageCode.en, value: 'SEO OG Image URL' },
            { languageCode: LanguageCode.id, value: 'URL Gambar OG SEO' },
        ],
        description: [
            { languageCode: LanguageCode.en, value: 'OpenGraph image URL used when sharing links' },
            { languageCode: LanguageCode.id, value: 'URL gambar OpenGraph saat tautan dibagikan' },
        ],
    },
];

function mergeSeoFieldDefinitions(existingFields: CustomFieldConfig[] = []): CustomFieldConfig[] {
    const existingFieldNames = new Set(existingFields.map(field => field.name));
    const missingSeoFields = seoFieldDefinitions.filter(field => !existingFieldNames.has(field.name));
    return [...existingFields, ...missingSeoFields];
}

@VendurePlugin({
    imports: [PluginCommonModule],
    providers: [
        SeoMetadataService,
        {
            provide: SEO_METADATA_PLUGIN_OPTIONS,
            useFactory: () => SeoMetadataPlugin.options,
        },
    ],
    adminApiExtensions: {
        schema: graphqlAdminSchema,
        resolvers: [ProductSeoResolver, CollectionSeoResolver],
    },
    shopApiExtensions: {
        schema: graphqlShopSchema,
        resolvers: [ProductSeoResolver, CollectionSeoResolver, SeoMetadataShopResolver],
    },
    configuration: config => {
        const customFields = config.customFields ?? {};
        config.customFields = {
            ...customFields,
            Product: mergeSeoFieldDefinitions(customFields.Product),
            Collection: mergeSeoFieldDefinitions(customFields.Collection),
        };
        return config;
    },
    compatibility: '^3.0.0',
})
export class SeoMetadataPlugin {
    static options: Required<SeoMetadataPluginOptions> = defaultSeoMetadataPluginOptions;

    static init(options: SeoMetadataPluginOptions = {}): typeof SeoMetadataPlugin {
        this.options = {
            ...defaultSeoMetadataPluginOptions,
            ...options,
        };
        return SeoMetadataPlugin;
    }
}
