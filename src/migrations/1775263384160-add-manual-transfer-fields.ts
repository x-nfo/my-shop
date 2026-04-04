import {MigrationInterface, QueryRunner} from "typeorm";

export class AddManualTransferFields1775263384160 implements MigrationInterface {

   public async up(queryRunner: QueryRunner): Promise<any> {
        await queryRunner.query(`ALTER TABLE "order" ADD COLUMN IF NOT EXISTS "customFieldsManualtransferproofassetid" integer`, undefined);
        await queryRunner.query(`ALTER TABLE "order" ADD COLUMN IF NOT EXISTS "customFieldsManualtransferproofuploadedat" TIMESTAMP(6)`, undefined);
        await queryRunner.query(`ALTER TABLE "order" ADD COLUMN IF NOT EXISTS "customFieldsManualtransferverificationstatus" character varying(255) DEFAULT 'PENDING'`, undefined);
        await queryRunner.query(`ALTER TABLE "order" ADD COLUMN IF NOT EXISTS "customFieldsManualtransferverificationnote" text`, undefined);
        await queryRunner.query(`ALTER TABLE "order" ADD COLUMN IF NOT EXISTS "customFieldsManualtransferverifiedat" TIMESTAMP(6)`, undefined);
        await queryRunner.query(`
            DO $$
            BEGIN
                IF NOT EXISTS (
                    SELECT 1
                    FROM pg_constraint
                    WHERE conname = 'FK_6053525d3676301d785997852f2'
                ) THEN
                    ALTER TABLE "order"
                    ADD CONSTRAINT "FK_6053525d3676301d785997852f2"
                    FOREIGN KEY ("customFieldsManualtransferproofassetid") REFERENCES "asset"("id")
                    ON DELETE NO ACTION ON UPDATE NO ACTION;
                END IF;
            END $$;
        `, undefined);
   }

   public async down(queryRunner: QueryRunner): Promise<any> {
        await queryRunner.query(`ALTER TABLE "order" DROP CONSTRAINT IF EXISTS "FK_6053525d3676301d785997852f2"`, undefined);
        await queryRunner.query(`ALTER TABLE "order" DROP COLUMN IF EXISTS "customFieldsManualtransferverifiedat"`, undefined);
        await queryRunner.query(`ALTER TABLE "order" DROP COLUMN IF EXISTS "customFieldsManualtransferverificationnote"`, undefined);
        await queryRunner.query(`ALTER TABLE "order" DROP COLUMN IF EXISTS "customFieldsManualtransferverificationstatus"`, undefined);
        await queryRunner.query(`ALTER TABLE "order" DROP COLUMN IF EXISTS "customFieldsManualtransferproofuploadedat"`, undefined);
        await queryRunner.query(`ALTER TABLE "order" DROP COLUMN IF EXISTS "customFieldsManualtransferproofassetid"`, undefined);
   }

}
