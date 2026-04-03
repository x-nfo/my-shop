import {MigrationInterface, QueryRunner} from "typeorm";

export class AddAbandonedCartFields1775237140684 implements MigrationInterface {

   public async up(queryRunner: QueryRunner): Promise<any> {
        await queryRunner.query(`ALTER TABLE "order" ADD COLUMN IF NOT EXISTS "customFieldsAbandonedcartrecoverytoken" character varying(255)`, undefined);
        await queryRunner.query(`ALTER TABLE "order" ADD COLUMN IF NOT EXISTS "customFieldsAbandonedcartrecoverylastsentat" TIMESTAMP(6)`, undefined);
        await queryRunner.query(`ALTER TABLE "order" ADD COLUMN IF NOT EXISTS "customFieldsAbandonedcartrecoveryemailcount" integer DEFAULT 0`, undefined);
   }

   public async down(queryRunner: QueryRunner): Promise<any> {
        await queryRunner.query(`ALTER TABLE "order" DROP COLUMN IF EXISTS "customFieldsAbandonedcartrecoveryemailcount"`, undefined);
        await queryRunner.query(`ALTER TABLE "order" DROP COLUMN IF EXISTS "customFieldsAbandonedcartrecoverylastsentat"`, undefined);
        await queryRunner.query(`ALTER TABLE "order" DROP COLUMN IF EXISTS "customFieldsAbandonedcartrecoverytoken"`, undefined);
   }

}
