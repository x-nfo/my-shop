import { MigrationInterface, QueryRunner } from 'typeorm';

export class HardenProductReview1775232800000 implements MigrationInterface {
    name = 'HardenProductReview1775232800000';

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(
            `CREATE INDEX IF NOT EXISTS "IDX_product_review_product_status_createdAt" ON "product_review" ("productId", "status", "createdAt")`,
        );
        await queryRunner.query(
            `CREATE INDEX IF NOT EXISTS "IDX_product_review_status_createdAt" ON "product_review" ("status", "createdAt")`,
        );
        await queryRunner.query(`
            DO $$
            BEGIN
                IF NOT EXISTS (
                    SELECT 1
                    FROM pg_constraint
                    WHERE conname = 'CHK_product_review_rating_range'
                ) THEN
                    ALTER TABLE "product_review"
                    ADD CONSTRAINT "CHK_product_review_rating_range"
                    CHECK ("rating" >= 1 AND "rating" <= 5) NOT VALID;
                END IF;
            END $$;
        `);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(
            `ALTER TABLE "product_review" DROP CONSTRAINT IF EXISTS "CHK_product_review_rating_range"`,
        );
        await queryRunner.query(
            `DROP INDEX IF EXISTS "public"."IDX_product_review_status_createdAt"`,
        );
        await queryRunner.query(
            `DROP INDEX IF EXISTS "public"."IDX_product_review_product_status_createdAt"`,
        );
    }
}
