import { IEmailService } from '../interfaces';

export class FakeEmailService implements IEmailService {
  sentEmails: Array<{ to: string; subject: string; html: string }> = [];

  async sendEmail(to: string, subject: string, html: string): Promise<boolean> {
    this.sentEmails.push({ to, subject, html });
    return true;
  }
}
