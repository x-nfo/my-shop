import { MigrationInterface, QueryRunner } from 'typeorm';

export class HardenSeoCustomFields1760000000010 implements MigrationInterface {
    name = 'HardenSeoCustomFields1760000000010';

    public async up(queryRunner: QueryRunner): Promise<void> {
        // Hardening for Product table
        await this.ensureColumn(queryRunner, 'product', 'customFieldsSeotitle', 'character varying(255)');
        await this.ensureColumn(queryRunner, 'product', 'customFieldsSeodescription', 'text');
        await this.ensureColumn(queryRunner, 'product', 'customFieldsSeoogimageurl', 'character varying(2048)');

        // Hardening for Collection table
        await this.ensureColumn(queryRunner, 'collection', 'customFieldsSeotitle', 'character varying(255)');
        await this.ensureColumn(queryRunner, 'collection', 'customFieldsSeodescription', 'text');
        await this.ensureColumn(queryRunner, 'collection', 'customFieldsSeoogimageurl', 'character varying(2048)');
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        // Minimal safe rollback as per remediation plan: 
        // "Jangan drop kolom jika ada risiko kehilangan data existing"
        // Since these are core SEO fields, we might not want to drop them in down() 
        // to prevent accidental data loss.
    }

    private async ensureColumn(queryRunner: QueryRunner, tableName: string, columnName: string, columnType: string) {
        const hasColumn = await queryRunner.hasColumn(tableName, columnName);
        if (!hasColumn) {
            await queryRunner.query(`ALTER TABLE "${tableName}" ADD COLUMN "${columnName}" ${columnType}`);
        }
    }
}
