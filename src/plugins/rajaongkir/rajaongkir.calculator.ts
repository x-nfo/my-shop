import { Injector, LanguageCode, ShippingCalculator } from '@vendure/core';
import { RajaOngkirService } from './rajaongkir.service';

// Referensi ke injected service (pola sama seperti di docs Vendure)
let rajaOngkirService: RajaOngkirService;

export const rajaongkirCalculator = new ShippingCalculator({
  code: 'rajaongkir-calculator',
  description: [
    { languageCode: LanguageCode.en, value: 'RajaOngkir Shipping Calculator' },
    { languageCode: LanguageCode.id, value: 'Kalkulator Ongkir RajaOngkir' },
  ],
  args: {
    courierCode: {
      type: 'string',
      label: [{ languageCode: LanguageCode.en, value: 'Courier' }],
      description: [{ languageCode: LanguageCode.en, value: 'Pilih kurir pengiriman' }],
      ui: {
        component: 'select-form-input',
        options: [
          { value: 'jne', label: [{ languageCode: LanguageCode.en, value: 'JNE' }] },
          { value: 'tiki', label: [{ languageCode: LanguageCode.en, value: 'TIKI' }] },
          { value: 'sicepat', label: [{ languageCode: LanguageCode.en, value: 'SiCepat' }] },
          { value: 'pos', label: [{ languageCode: LanguageCode.en, value: 'POS Indonesia' }] },
          { value: 'anteraja', label: [{ languageCode: LanguageCode.en, value: 'AnterAja' }] },
          { value: 'jnt', label: [{ languageCode: LanguageCode.en, value: 'J&T Express' }] },
          { value: 'ninja', label: [{ languageCode: LanguageCode.en, value: 'Ninja Express' }] },
          { value: 'lion', label: [{ languageCode: LanguageCode.en, value: 'Lion Parcel' }] },
        ],
      },
    },
    serviceType: {
      type: 'string',
      label: [{ languageCode: LanguageCode.en, value: 'Service Type' }],
      description: [{ languageCode: LanguageCode.en, value: 'Pilih tipe layanan kurir' }],
      ui: {
        component: 'select-form-input',
        options: [
          { value: 'REG', label: [{ languageCode: LanguageCode.en, value: 'REG (Regular)' }] },
          { value: 'YES', label: [{ languageCode: LanguageCode.en, value: 'YES (Yakin Esok Sampai)' }] },
          { value: 'OKE', label: [{ languageCode: LanguageCode.en, value: 'OKE (Ongkos Kirim Ekonomis)' }] },
          { value: 'BEST', label: [{ languageCode: LanguageCode.en, value: 'BEST (SiCepat Best)' }] },
          { value: 'HALU', label: [{ languageCode: LanguageCode.en, value: 'HALU (SiCepat Halu)' }] },
          { value: 'GOKIL', label: [{ languageCode: LanguageCode.en, value: 'GOKIL (SiCepat Gokil)' }] },
          { value: 'ECO', label: [{ languageCode: LanguageCode.en, value: 'ECO (Ekonomi)' }] },
          { value: 'EXP', label: [{ languageCode: LanguageCode.en, value: 'EXP (Express)' }] },
          { value: 'STD', label: [{ languageCode: LanguageCode.en, value: 'STD (Standard)' }] },
          { value: 'Paket Kilat Khusus', label: [{ languageCode: LanguageCode.en, value: 'POS Kilat Khusus' }] },
          { value: 'Express Next Day', label: [{ languageCode: LanguageCode.en, value: 'POS Express Next Day' }] },
        ],
      },
    },
  },

  init(injector: Injector) {
    rajaOngkirService = injector.get(RajaOngkirService);
  },

  calculate: async (ctx, order, args) => {
    // 1. Ambil destination ID dari custom field di shippingAddress
    //    (Storefront harus menyimpan ID RajaOngkir di sini saat user memilih alamat)
    const destinationId = (order.shippingAddress as any)?.customFields?.rajaongkirDestinationId
      || order.shippingAddress?.postalCode
      || '';

    if (!destinationId) {
      // Tidak ada alamat tujuan, return harga 0 (fallback)
      return {
        price: 0,
        priceIncludesTax: ctx.channel.pricesIncludeTax,
        taxRate: 0,
        metadata: { error: 'No destination ID provided' },
      };
    }

    // 2. Berat total (gunakan default 1000g jika tidak ada custom field weight)
    const weight = order.lines.reduce((total, line) => {
      const itemWeight = (line.productVariant.customFields as any)?.weight ?? 500; // default 500g per item
      return total + (itemWeight * line.quantity);
    }, 0);

    // 3. Panggil RajaOngkir API (sudah ada caching di service)
    const allRates = await rajaOngkirService.calculateShippingRates(destinationId, weight);

    // 4. Cari rate yang cocok dengan args (kurir + service)
    const matchedRate = allRates.find(
      r => r.courierCode.toLowerCase() === args.courierCode.toLowerCase()
        && r.service.toLowerCase() === args.serviceType.toLowerCase()
    );

    if (!matchedRate) {
      // Tidak ditemukan rate yang cocok
      return {
        price: 0,
        priceIncludesTax: ctx.channel.pricesIncludeTax,
        taxRate: 0,
        metadata: { error: `No rate found for ${args.courierCode} ${args.serviceType}` },
      };
    }

    // 5. Return hasil kalkulasi
    return {
      price: matchedRate.price,
      priceIncludesTax: ctx.channel.pricesIncludeTax,
      taxRate: 0,
      metadata: {
        courierCode: matchedRate.courierCode,
        courierName: matchedRate.courierName,
        service: matchedRate.service,
        description: matchedRate.description,
        etd: matchedRate.etd,
      },
    };
  },
});
