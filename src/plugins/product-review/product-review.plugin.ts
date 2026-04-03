import { PluginCommonModule, VendurePlugin } from '@vendure/core';
import { ProductReview } from './product-review.entity';
import { ProductReviewService } from './product-review.service';
import { ProductReviewShopResolver, ProductReviewEntityResolver } from './product-review.resolver';
import { shopApiExtensions, adminApiExtensions } from './schema';
import { ProductReviewAdminResolver } from './product-review.admin-resolver';

@VendurePlugin({
    imports: [PluginCommonModule],
    entities: [ProductReview],
    providers: [ProductReviewService],
    shopApiExtensions: {
        schema: shopApiExtensions,
        resolvers: [ProductReviewShopResolver, ProductReviewEntityResolver],
    },
    adminApiExtensions: {
        schema: adminApiExtensions,
        resolvers: [ProductReviewAdminResolver],
    },
    compatibility: '^3.0.0',
})
export class ProductReviewPlugin {}
