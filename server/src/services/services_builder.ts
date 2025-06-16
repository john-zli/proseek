import { CaptchaService } from './captcha';
import { GeocodeService } from './geocode';

export interface IServicesBuilder {
  readonly geocode: GeocodeService;
  readonly captcha: CaptchaService;
}

export class ServicesBuilder implements IServicesBuilder {
  readonly geocode: GeocodeService;
  readonly captcha: CaptchaService;

  constructor() {
    this.geocode = new GeocodeService();
    this.captcha = new CaptchaService();
  }
}

export const services = new ServicesBuilder();
