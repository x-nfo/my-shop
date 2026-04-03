import { Injectable } from '@nestjs/common';

// --- Interfaces ---
export interface RajaOngkirCostResult {
  code: string;       // kode kurir, mis: "jne"
  name: string;       // nama kurir, mis: "Jalur Nugraha Ekakurir"
  costs: {
    service: string;    // tipe layanan, mis: "REG", "YES", "OKE"
    description: string;
    cost: {
      value: number;      // harga dalam Rupiah
      etd: string;        // estimasi hari, mis: "1-2"
      note: string;
    }[];
  }[];
}

export interface ShippingRate {
  courierCode: string;
  courierName: string;
  service: string;
  description: string;
  price: number;
  etd: string;
}

// --- Cache Entry ---
interface CacheEntry {
  data: ShippingRate[];
  timestamp: number;
}

// --- Service ---
@Injectable()
export class RajaOngkirService {
  private readonly baseUrl = 'https://rajaongkir.komerce.id/api/v1';
  private readonly apiKey = process.env.RAJAONGKIR_API_KEY || '';
  private readonly originId = process.env.RAJAONGKIR_ORIGIN || '';
  private readonly CACHE_TTL_MS = 10 * 60 * 1000; // 10 menit

  // Cache sederhana: key = "origin-destination-weight", value = hasil
  private cache = new Map<string, CacheEntry>();

  /**
   * Hitung ongkos kirim dari origin toko ke destinasi pembeli.
   * Memanggil API untuk setiap kurir yang didukung, lalu menggabungkan hasilnya.
   */
  async calculateShippingRates(
    destinationId: string,
    weightInGrams: number,
  ): Promise<ShippingRate[]> {
    const cacheKey = `${this.originId}-${destinationId}-${weightInGrams}`;

    // 1. Cek cache
    const cached = this.cache.get(cacheKey);
    if (cached && Date.now() - cached.timestamp < this.CACHE_TTL_MS) {
      console.log(`[RajaOngkir] Cache HIT for ${cacheKey}`);
      return cached.data;
    }

    // 2. Panggil API untuk beberapa kurir sekaligus
    const couriers = ['jne', 'tiki', 'sicepat', 'pos', 'anteraja', 'jnt', 'ninja', 'lion'];
    const allRates: ShippingRate[] = [];

    for (const courier of couriers) {
      try {
        const rates = await this.fetchCost(destinationId, weightInGrams, courier);
        allRates.push(...rates);
      } catch (err: any) {
        console.error(`[RajaOngkir] Error fetching ${courier}:`, err.message);
        // Lanjutkan ke kurir berikutnya, jangan gagalkan seluruh request
      }
    }

    // 3. Simpan ke cache
    this.cache.set(cacheKey, { data: allRates, timestamp: Date.now() });
    console.log(`[RajaOngkir] Cache SET for ${cacheKey} (${allRates.length} rates)`);

    return allRates;
  }

  /**
   * Panggil endpoint calculate/domestic-cost untuk 1 kurir.
   */
  private async fetchCost(
    destinationId: string,
    weight: number,
    courier: string,
  ): Promise<ShippingRate[]> {
    const body = new URLSearchParams({
      origin: this.originId,
      destination: destinationId,
      weight: String(weight),
      courier,
    });

    const response = await fetch(`${this.baseUrl}/calculate/domestic-cost`, {
      method: 'POST',
      headers: {
        'key': this.apiKey,
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: body.toString(),
    });

    if (!response.ok) {
      throw new Error(`RajaOngkir API error: ${response.status} ${response.statusText}`);
    }

    const json = await response.json();
    const results: RajaOngkirCostResult[] = json?.rajaongkir?.results ?? [];

    // Transform ke format ShippingRate yang flat
    const rates: ShippingRate[] = [];
    for (const result of results) {
      for (const costGroup of result.costs) {
        for (const cost of costGroup.cost) {
          rates.push({
            courierCode: result.code,
            courierName: result.name,
            service: costGroup.service,
            description: costGroup.description,
            price: cost.value,
            etd: cost.etd,
          });
        }
      }
    }

    return rates;
  }

  /**
   * Cari lokasi domestik (untuk storefront autocomplete).
   */
  async searchDestination(keyword: string): Promise<any[]> {
    try {
      const url = `${this.baseUrl}/destination/domestic-destination?search=${encodeURIComponent(keyword)}&limit=10`;

      const response = await fetch(url, {
        method: 'GET',
        headers: { 'key': this.apiKey },
      });

      if (!response.ok) {
        throw new Error(`RajaOngkir API error: ${response.status}`);
      }

      const json = await response.json();
      return json?.rajaongkir?.results ?? [];
    } catch (err: any) {
      console.error(`[RajaOngkir] Search error:`, err.message);
      return [];
    }
  }
}
