import { Controller, Get, Query } from '@nestjs/common';
import { RajaOngkirService } from './rajaongkir.service';

@Controller('rajaongkir')
export class RajaOngkirController {
  constructor(private rajaOngkirService: RajaOngkirService) {}

  /**
   * GET /rajaongkir/destinations?search=bandung
   * Untuk autocomplete pencarian lokasi di storefront.
   */
  @Get('destinations')
  async searchDestinations(@Query('search') search: string) {
    if (!search || search.length < 3) {
      return { results: [] };
    }
    const results = await this.rajaOngkirService.searchDestination(search);
    return { results };
  }

  /**
   * GET /rajaongkir/cost?destination=123&weight=1000
   * Untuk menghitung ongkir langsung dari storefront.
   */
  @Get('cost')
  async calculateCost(
    @Query('destination') destination: string,
    @Query('weight') weight: string,
  ) {
    if (!destination || !weight) {
      return { error: 'Missing destination or weight parameter', rates: [] };
    }
    const rates = await this.rajaOngkirService.calculateShippingRates(
      destination,
      parseInt(weight, 10) || 1000,
    );
    return { rates };
  }
}
