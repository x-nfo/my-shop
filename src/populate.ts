import { bootstrap, runMigrations } from '@vendure/core';
import { populate } from '@vendure/core/cli';
import path from 'path';
import { config } from './vendure-config';
import { initialData } from './initial-data';

const productsCsvFile = path.join(__dirname, 'products.csv');

runMigrations(config)
    .then(() => 
        populate(
            () => bootstrap({
                ...config,
                apiOptions: {
                    ...config.apiOptions,
                    port: 3005, // Use a different port during population
                },
            }),
            initialData,
            productsCsvFile,
        )
    )
    .then(app => app.close())
    .then(
        () => process.exit(0),
        err => {
            console.error(err);
            process.exit(1);
        },
    );
