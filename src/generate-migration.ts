import { generateMigration } from '@vendure/core';
import { config } from './vendure-config';
import path from 'path';

/**
 * @description
 * Generates a new migration file based on the current configuration.
 * Usage: ts-node src/generate-migration.ts <migration-name>
 */
const name = process.argv[2] || 'add-abandoned-cart-fields';

generateMigration(config, {
    name,
    outputDir: path.join(__dirname, 'migrations'),
})
    .then(() => {
        process.exit(0);
    })
    .catch(err => {
        console.error(err);
        process.exit(1);
    });
