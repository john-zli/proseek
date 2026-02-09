import { GeocodeResult } from '../geocode';
import { IGeocodeService } from '../interfaces';

export class FakeGeocodeService implements IGeocodeService {
  async geocodeAddress(_address: string): Promise<GeocodeResult | null> {
    return {
      latitude: 37.7749,
      longitude: -122.4194,
      formattedAddress: 'San Francisco, CA, USA',
      city: 'San Francisco',
      state: 'CA',
      country: 'USA',
    };
  }

  async reverseGeocode(_latitude: number, _longitude: number): Promise<GeocodeResult | null> {
    return {
      latitude: 37.7749,
      longitude: -122.4194,
      formattedAddress: 'San Francisco, CA, USA',
      city: 'San Francisco',
      state: 'CA',
      country: 'USA',
    };
  }
}
