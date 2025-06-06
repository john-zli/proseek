import fetch from 'node-fetch';
import NodeGeocoder from 'node-geocoder';

import config from '@server/config';

const options = {
  provider: 'google' as const,
  apiKey: config.googleMapsApiKey,
  formatter: null,
  fetch: fetch,
};

const geocoder = NodeGeocoder(options);

export interface GeocodeResult {
  latitude: number;
  longitude: number;
  formattedAddress: string;
  streetNumber?: string;
  streetName?: string;
  city?: string;
  state?: string;
  country?: string;
}

export async function geocodeAddress(address: string): Promise<GeocodeResult | null> {
  try {
    const results = await geocoder.geocode(address);
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
    console.error('Error geocoding address:', error);
    return null;
  }
}

export async function reverseGeocode(latitude: number, longitude: number): Promise<GeocodeResult | null> {
  try {
    const results = await geocoder.reverse({ lat: latitude, lon: longitude });
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
    console.error('Error reverse geocoding coordinates:', error);
    return null;
  }
}
