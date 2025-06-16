import { GeocodeService } from '../geocode';

export class FakeGeocodeService extends GeocodeService {
  async geocodeAddress(_address: string) {
    return {
      latitude: 37.7749,
      longitude: -122.4194,
      formattedAddress: 'San Francisco, CA, USA',
      city: 'San Francisco',
      state: 'CA',
      country: 'USA',
    };
  }

  async reverseGeocode(_latitude: number, _longitude: number) {
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
