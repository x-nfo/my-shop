import { PluginCommonModule, VendurePlugin } from '@vendure/core';
import { RajaOngkirService } from './rajaongkir.service';
import { RajaOngkirController } from './rajaongkir.controller';
import { rajaongkirCalculator } from './rajaongkir.calculator';
import { rajaongkirChecker } from './rajaongkir.checker';

@VendurePlugin({
  imports: [PluginCommonModule],
  controllers: [RajaOngkirController],
  providers: [RajaOngkirService],
  configuration: config => {
    // Daftarkan calculator ke Vendure
    config.shippingOptions.shippingCalculators?.push(rajaongkirCalculator);
    // Daftarkan checker ke Vendure
    config.shippingOptions.shippingEligibilityCheckers?.push(rajaongkirChecker);
    return config;
  },
  compatibility: '^3.0.0',
})
export class RajaOngkirPlugin {}
