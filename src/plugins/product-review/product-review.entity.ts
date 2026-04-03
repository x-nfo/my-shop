import { DeepPartial, VendureEntity, Product, Customer } from '@vendure/core';
import { Column, Entity, Index, ManyToOne } from 'typeorm';
import { ReviewStatus } from './product-review.types';

@Entity()
@Index(['product', 'customer'], { unique: true })
@Index(['product', 'status', 'createdAt'])
@Index(['status', 'createdAt'])
export class ProductReview extends VendureEntity {
    constructor(input?: DeepPartial<ProductReview>) {
        super(input);
    }

    @ManyToOne(type => Product)
    product: Product;

    @ManyToOne(type => Customer)
    customer: Customer;

    @Column()
    rating: number;

    @Column('text')
    text: string;

    @Column({ type: 'varchar', default: ReviewStatus.Pending })
    status: ReviewStatus;

    @Column({ type: 'text', nullable: true })
    moderationNote: string | null;
}
