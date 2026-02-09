import { CaptchaService } from './captcha';
import { EmailService } from './email';
import { GeocodeService } from './geocode';
import { ICaptchaService, IEmailService, IGeocodeService } from './interfaces';

export interface IServicesBuilder {
  readonly geocode: IGeocodeService;
  readonly captcha: ICaptchaService;
  readonly email: IEmailService;
}

export class ServicesBuilder implements IServicesBuilder {
  readonly geocode: GeocodeService;
  readonly captcha: CaptchaService;
  readonly email: EmailService;

  constructor() {
    this.geocode = new GeocodeService();
    this.captcha = new CaptchaService();
    this.email = new EmailService();
  }
}

export const services = new ServicesBuilder();
