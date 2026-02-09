import { GeocodeResult } from './geocode';

export interface IGeocodeService {
  geocodeAddress(address: string): Promise<GeocodeResult | null>;
  reverseGeocode(latitude: number, longitude: number): Promise<GeocodeResult | null>;
}

export interface ICaptchaService {
  validateToken(token: string): Promise<{ success: boolean }>;
  redeemChallenge(token: string, solutions: number[]): Promise<{ success: boolean }>;
  createChallenge(): Promise<{
    challenge: { c: number; s: number; d: number };
    token?: string;
    expires: number;
  }>;
}

export interface IEmailService {
  sendEmail(to: string, subject: string, html: string): Promise<boolean>;
}
