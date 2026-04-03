import { LanguageCode, ShippingEligibilityChecker } from '@vendure/core';

export const rajaongkirChecker = new ShippingEligibilityChecker({
  code: 'rajaongkir-checker',
  description: [
    { languageCode: LanguageCode.en, value: 'RajaOngkir Domestic Shipping Checker' },
    { languageCode: LanguageCode.id, value: 'Cek Kelayakan Pengiriman Domestik RajaOngkir' },
  ],
  args: {},

  check: (ctx, order, args) => {
    // Hanya boleh jika alamat pengiriman ada dan negara = Indonesia
    const countryCode = order.shippingAddress?.countryCode;
    return countryCode === 'ID';
  },

  shouldRunCheck: (ctx, order) => {
    // Hanya jalankan ulang check() jika alamat pengiriman berubah
    return order.shippingAddress;
  },
});
