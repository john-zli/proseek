import { CaptchaService } from './captcha';
import { GeocodeService } from './geocode';

export class ServicesBuilder {
  private static instance: ServicesBuilder;

  readonly geocode: GeocodeService;
  readonly captcha: CaptchaService;

  constructor() {
    this.geocode = new GeocodeService();
    this.captcha = new CaptchaService();
  }
}

export const services = new ServicesBuilder();
