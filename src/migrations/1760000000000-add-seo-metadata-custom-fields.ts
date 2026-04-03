import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddSeoMetadataCustomFields1760000000000 implements MigrationInterface {
    name = 'AddSeoMetadataCustomFields1760000000000';

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(
            `ALTER TABLE "product" ADD COLUMN IF NOT EXISTS "customFieldsSeotitle" character varying(255)`,
        );
        await queryRunner.query(
            `ALTER TABLE "product" ADD COLUMN IF NOT EXISTS "customFieldsSeodescription" text`,
        );
        await queryRunner.query(
            `ALTER TABLE "product" ADD COLUMN IF NOT EXISTS "customFieldsSeoogimageurl" character varying(2048)`,
        );
        await queryRunner.query(
            `ALTER TABLE "collection" ADD COLUMN IF NOT EXISTS "customFieldsSeotitle" character varying(255)`,
        );
        await queryRunner.query(
            `ALTER TABLE "collection" ADD COLUMN IF NOT EXISTS "customFieldsSeodescription" text`,
        );
        await queryRunner.query(
            `ALTER TABLE "collection" ADD COLUMN IF NOT EXISTS "customFieldsSeoogimageurl" character varying(2048)`,
        );
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(
            `ALTER TABLE "collection" DROP COLUMN IF EXISTS "customFieldsSeoogimageurl"`,
        );
        await queryRunner.query(
            `ALTER TABLE "collection" DROP COLUMN IF EXISTS "customFieldsSeodescription"`,
        );
        await queryRunner.query(
            `ALTER TABLE "collection" DROP COLUMN IF EXISTS "customFieldsSeotitle"`,
        );
        await queryRunner.query(
            `ALTER TABLE "product" DROP COLUMN IF EXISTS "customFieldsSeoogimageurl"`,
        );
        await queryRunner.query(
            `ALTER TABLE "product" DROP COLUMN IF EXISTS "customFieldsSeodescription"`,
        );
        await queryRunner.query(
            `ALTER TABLE "product" DROP COLUMN IF EXISTS "customFieldsSeotitle"`,
        );
    }
}
