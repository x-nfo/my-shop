import { Injectable } from '@nestjs/common';
import {
    ID,
    RequestContext,
    TransactionalConnection,
    Product,
    Customer,
    ListQueryBuilder,
    PaginatedList,
    UserInputError,
    ForbiddenError,
} from '@vendure/core';
import { ProductReview } from './product-review.entity';
import { ReviewStatus } from './product-review.types';
import { QueryFailedError } from 'typeorm';

const MAX_REVIEW_TEXT_LENGTH = 2000;
const POSTGRES_UNIQUE_VIOLATION_CODE = '23505';

@Injectable()
export class ProductReviewService {
    constructor(
        private connection: TransactionalConnection,
        private listQueryBuilder: ListQueryBuilder,
    ) {}

    async findAll(ctx: RequestContext, options?: any): Promise<PaginatedList<ProductReview>> {
        return this.listQueryBuilder
            .build(ProductReview, options, {
                ctx,
                relations: ['product', 'customer'],
            })
            .getManyAndCount()
            .then(([items, totalItems]) => ({
                items,
                totalItems,
            }));
    }

    async findForModeration(ctx: RequestContext, options?: any): Promise<PaginatedList<ProductReview>> {
        return this.listQueryBuilder
            .build(ProductReview, options, {
                ctx,
                relations: ['product', 'customer'],
                where: {
                    status: ReviewStatus.Pending,
                },
            })
            .getManyAndCount()
            .then(([items, totalItems]) => ({
                items,
                totalItems,
            }));
    }

    async findPublicByProductId(ctx: RequestContext, productId: ID, options?: any): Promise<PaginatedList<ProductReview>> {
        return this.listQueryBuilder
            .build(ProductReview, options, {
                ctx,
                relations: ['product'],
                where: {
                    product: { id: productId },
                    status: ReviewStatus.Approved,
                },
            })
            .getManyAndCount()
            .then(([items, totalItems]) => ({
                items,
                totalItems,
            }));
    }

    async submitReview(ctx: RequestContext, customerId: ID, productId: ID, rating: number, text: string): Promise<ProductReview> {
        const normalizedText = this.validateAndNormalizeText(text);
        this.validateRating(rating);

        const product = await this.connection.getEntityOrThrow(ctx, Product, productId);
        const customer = await this.connection.getEntityOrThrow(ctx, Customer, customerId);

        const review = new ProductReview({
            product,
            customer,
            rating,
            text: normalizedText,
            status: ReviewStatus.Pending,
        });

        try {
            return await this.connection.getRepository(ctx, ProductReview).save(review);
        } catch (error: unknown) {
            if (this.isUniqueConstraintViolation(error)) {
                throw new UserInputError('You have already submitted a review for this product');
            }
            throw error;
        }
    }

    async submitReviewByUserId(ctx: RequestContext, userId: ID, productId: ID, rating: number, text: string): Promise<ProductReview> {
        const customer = await this.connection.getRepository(ctx, Customer).findOne({
            where: { user: { id: userId } },
        });
        if (!customer) {
            throw new ForbiddenError();
        }
        return this.submitReview(ctx, customer.id, productId, rating, text);
    }

    async approve(ctx: RequestContext, id: ID, note?: string): Promise<ProductReview> {
        const review = await this.connection.getEntityOrThrow(ctx, ProductReview, id);
        review.status = ReviewStatus.Approved;
        review.moderationNote = this.normalizeOptionalText(note);
        return this.connection.getRepository(ctx, ProductReview).save(review);
    }

    async reject(ctx: RequestContext, id: ID, note?: string): Promise<ProductReview> {
        const review = await this.connection.getEntityOrThrow(ctx, ProductReview, id);
        review.status = ReviewStatus.Rejected;
        review.moderationNote = this.normalizeOptionalText(note);
        return this.connection.getRepository(ctx, ProductReview).save(review);
    }

    async getAverageRating(ctx: RequestContext, productId: ID): Promise<number> {
        const result = await this.connection
            .getRepository(ctx, ProductReview)
            .createQueryBuilder('review')
            .select('AVG(review.rating)', 'average')
            .where('review.productId = :productId', { productId })
            .andWhere('review.status = :status', { status: ReviewStatus.Approved })
            .getRawOne();
        
        return parseFloat(result.average) || 0;
    }

    async getReviewCount(ctx: RequestContext, productId: ID): Promise<number> {
        return this.connection
            .getRepository(ctx, ProductReview)
            .count({
                where: {
                    product: { id: productId },
                    status: ReviewStatus.Approved,
                },
            });
    }

    private validateRating(rating: number): void {
        if (!Number.isInteger(rating) || rating < 1 || rating > 5) {
            throw new UserInputError('Rating must be an integer between 1 and 5');
        }
    }

    private validateAndNormalizeText(text: string): string {
        const normalized = (text ?? '').trim();
        if (!normalized) {
            throw new UserInputError('Review text is required');
        }
        if (normalized.length > MAX_REVIEW_TEXT_LENGTH) {
            throw new UserInputError(`Review text must be at most ${MAX_REVIEW_TEXT_LENGTH} characters`);
        }
        return normalized;
    }

    private normalizeOptionalText(text?: string): string | null {
        if (typeof text !== 'string') {
            return null;
        }
        const normalized = text.trim();
        return normalized.length > 0 ? normalized : null;
    }

    private isUniqueConstraintViolation(error: unknown): boolean {
        if (error instanceof QueryFailedError) {
            const code = (error as QueryFailedError & { driverError?: { code?: string } }).driverError?.code;
            return code === POSTGRES_UNIQUE_VIOLATION_CODE;
        }
        if (error && typeof error === 'object') {
            const fallbackCode = (error as { code?: string; driverError?: { code?: string } }).code
                ?? (error as { code?: string; driverError?: { code?: string } }).driverError?.code;
            return fallbackCode === POSTGRES_UNIQUE_VIOLATION_CODE;
        }
        return false;
    }
}
