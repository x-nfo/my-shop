import { LanguageCode, InitialData } from '@vendure/core';

export const initialData: InitialData = {
    defaultLanguage: LanguageCode.en,
    defaultZone: 'Asia',
    taxRates: [
        { name: 'Standard Tax', percentage: 11 },
    ],
    shippingMethods: [
        { name: 'Standard Shipping', price: 10000 },
        { name: 'Express Shipping', price: 30000 },
    ],
    paymentMethods: [
        {
            name: 'Standard Payment',
            handler: {
                code: 'dummy-payment-handler',
                arguments: [{ name: 'automaticSettle', value: 'false' }],
            },
        },
        {
            name: 'Midtrans',
            handler: {
                code: 'midtrans',
                arguments: [
                    { name: 'serverKey', value: process.env.MIDTRANS_SERVER_KEY || '' },
                    { name: 'clientKey', value: process.env.MIDTRANS_CLIENT_KEY || '' },
                    { name: 'isProduction', value: process.env.MIDTRANS_IS_PRODUCTION || 'false' },
                ],
            },
        },
    ],
    countries: [
        { name: 'Indonesia', code: 'ID', zone: 'Asia' },
    ],
    collections: [
        {
            name: 'Plants',
            slug: 'plants',
            filters: [
                { code: 'facet-value-filter', args: { facetValueNames: ['Plants'], containsAny: false } },
            ],
        },
    ],
};
