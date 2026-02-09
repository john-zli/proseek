import { logger } from './logger';
import { Resend } from 'resend';

export class EmailService {
  private resend: Resend;
  private fromEmail: string;

  constructor() {
    this.resend = new Resend(process.env.RESEND_API_KEY);
    this.fromEmail = process.env.FROM_EMAIL || 'notifications@proseek.app';
  }

  async sendEmail(to: string, subject: string, html: string): Promise<boolean> {
    try {
      const { error } = await this.resend.emails.send({
        from: this.fromEmail,
        to,
        subject,
        html,
      });

      if (error) {
        logger.error({ error, to, subject }, 'Failed to send email');
        return false;
      }

      logger.info({ to, subject }, 'Email sent successfully');
      return true;
    } catch (err) {
      logger.error({ err, to, subject }, 'Error sending email');
      return false;
    }
  }
}
