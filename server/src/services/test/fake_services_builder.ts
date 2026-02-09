import { IServicesBuilder } from '../services_builder';
import { FakeCaptchaService } from './fake_captcha';
import { FakeEmailService } from './fake_email';
import { FakeGeocodeService } from './fake_geocode';

export class FakeServicesBuilder implements IServicesBuilder {
  readonly geocode: FakeGeocodeService;
  readonly captcha: FakeCaptchaService;
  readonly email: FakeEmailService;

  constructor() {
    this.geocode = new FakeGeocodeService();
    this.captcha = new FakeCaptchaService();
    this.email = new FakeEmailService();
  }
}
