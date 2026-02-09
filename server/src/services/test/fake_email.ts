import { IEmailService } from '../interfaces';

export class FakeEmailService implements IEmailService {
  async sendEmail(_to: string, _subject: string, _html: string): Promise<boolean> {
    return true;
  }
}
