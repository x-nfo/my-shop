export interface SeoMetadataPluginOptions {
    defaultOgImageUrl?: string;
}

export const defaultSeoMetadataPluginOptions: Required<SeoMetadataPluginOptions> = {
    defaultOgImageUrl: '',
};

export interface SeoMetadataPayload {
    title: string;
    description: string;
    ogImageUrl: string | null;
}

export const SEO_METADATA_PLUGIN_OPTIONS = Symbol('SEO_METADATA_PLUGIN_OPTIONS');
