import { logger } from './logger';
import config from '@server/config';
import fetch from 'node-fetch';
import NodeGeocoder from 'node-geocoder';

export interface GeocodeResult {
  latitude: number;
  longitude: number;
  formattedAddress: string;
  streetNumber?: string;
  streetName?: string;
  city?: string;
  state?: string;
  country?: string;
  zipcode?: string;
}

export class GeocodeService {
  private geocoder: NodeGeocoder.Geocoder;

  constructor() {
    const options = {
      provider: 'google' as const,
      apiKey: config.googleMapsApiKey,
      formatter: null,
      fetch: fetch,
    };
    this.geocoder = NodeGeocoder(options);
  }

  async geocodeAddress(address: string): Promise<GeocodeResult | null> {
    try {
      const results = await this.geocoder.geocode(address);
      if (!results || results.length === 0) {
        return null;
      }

      const result = results[0];
      return {
        latitude: result.latitude!,
        longitude: result.longitude!,
        formattedAddress: result.formattedAddress!,
        streetNumber: result.streetNumber,
        streetName: result.streetName,
        city: result.city,
        state: result.state,
        country: result.country,
        zipcode: result.zipcode,
      };
    } catch (error) {
      logger.error('Error geocoding address:', error);
      return null;
    }
  }

  async reverseGeocode(latitude: number, longitude: number): Promise<GeocodeResult | null> {
    try {
      const results = await this.geocoder.reverse({ lat: latitude, lon: longitude });
      if (!results || results.length === 0) {
        return null;
      }

      const result = results[0];
      return {
        latitude: result.latitude!,
        longitude: result.longitude!,
        formattedAddress: result.formattedAddress!,
        streetNumber: result.streetNumber,
        streetName: result.streetName,
        city: result.city,
        state: result.state,
        country: result.country,
      };
    } catch (error) {
      logger.error('Error reverse geocoding coordinates:', error);
      return null;
    }
  }
}
