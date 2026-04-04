import { gql } from 'graphql-tag';

export const shopApiExtensions = gql`
    extend type Mutation {
        submitManualTransferProof(orderCode: String!, file: Upload!, note: String): Order!
    }
`;

export const adminApiExtensions = gql`
    extend type Mutation {
        verifyManualTransferPayment(orderId: ID!, note: String): Order!
        rejectManualTransferProof(orderId: ID!, note: String): Order!
    }
`;
