import { IServicesBuilder } from '../services_builder';
import { FakeCaptchaService } from './fake_captcha';
import { FakeGeocodeService } from './fake_geocode';

export class FakeServicesBuilder implements IServicesBuilder {
  readonly geocode: FakeGeocodeService;
  readonly captcha: FakeCaptchaService;

  constructor() {
    this.geocode = new FakeGeocodeService();
    this.captcha = new FakeCaptchaService();
  }
}
