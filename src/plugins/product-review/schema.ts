import { gql } from 'graphql-tag';

export const shopApiExtensions = gql`
    enum ReviewStatus {
        Pending
        Approved
        Rejected
    }

    type ProductReview implements Node {
        id: ID!
        createdAt: DateTime!
        updatedAt: DateTime!
        rating: Int!
        text: String!
        status: ReviewStatus!
    }

    type ProductReviewList implements PaginatedList {
        items: [ProductReview!]!
        totalItems: Int!
    }

    input SubmitProductReviewInput {
        productId: ID!
        rating: Int!
        text: String!
    }

    extend type Mutation {
        submitProductReview(input: SubmitProductReviewInput!): ProductReview!
    }

    extend type Query {
        productReviews(productId: ID!, options: ProductReviewListOptions): ProductReviewList!
    }

    extend type Product {
        averageRating: Float!
        reviewCount: Int!
    }

    input ProductReviewListOptions {
        skip: Int
        take: Int
    }
`;

export const adminApiExtensions = gql`
    enum ReviewStatus {
        Pending
        Approved
        Rejected
    }

    type ProductReview implements Node {
        id: ID!
        createdAt: DateTime!
        updatedAt: DateTime!
        product: Product!
        customer: Customer!
        rating: Int!
        text: String!
        status: ReviewStatus!
        moderationNote: String
    }

    type ProductReviewList implements PaginatedList {
        items: [ProductReview!]!
        totalItems: Int!
    }

    extend type Query {
        productReviews(options: ProductReviewListOptions): ProductReviewList!
        productReviewsForModeration(options: ProductReviewListOptions): ProductReviewList!
    }

    extend type Mutation {
        approveProductReview(id: ID!, note: String): ProductReview!
        rejectProductReview(id: ID!, note: String): ProductReview!
    }

    input ProductReviewListOptions {
        skip: Int
        take: Int
        sort: ProductReviewSortParameter
        filter: ProductReviewFilterParameter
    }

    input ProductReviewSortParameter {
        id: SortOrder
        createdAt: SortOrder
        updatedAt: SortOrder
        rating: SortOrder
        status: SortOrder
    }

    input ProductReviewFilterParameter {
        id: IDOperators
        createdAt: DateOperators
        updatedAt: DateOperators
        rating: NumberOperators
        status: StringOperators
        productId: IDOperators
    }
`;
