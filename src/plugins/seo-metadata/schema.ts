import { gql } from 'graphql-tag';

const seoMetadataSchemaFragment = gql`
    type SeoMetadata {
        title: String!
        description: String!
        ogImageUrl: String
    }

    extend type Product {
        seo: SeoMetadata!
    }

    extend type Collection {
        seo: SeoMetadata!
    }
`;

export const graphqlAdminSchema = gql`
    ${seoMetadataSchemaFragment}
`;

export const graphqlShopSchema = gql`
    ${seoMetadataSchemaFragment}

    extend type Query {
        seoMetadataForProduct(slug: String!): SeoMetadata
        seoMetadataForCollection(slug: String!): SeoMetadata
    }
`;

