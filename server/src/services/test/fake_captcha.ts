import { CaptchaService } from '../captcha';

export class FakeCaptchaService extends CaptchaService {
  async validateToken(_token: string): Promise<{ success: boolean }> {
    return { success: true };
  }

  async redeemChallenge(_token: string, _solutions: number[]): Promise<{ success: boolean }> {
    return { success: true };
  }

  async createChallenge(): Promise<{
    challenge: { c: number; s: number; d: number };
    token?: string;
    expires: number;
  }> {
    return {
      challenge: { c: 1, s: 1, d: 1 },
      token: 'fake-token',
      expires: Date.now() + 3600000, // 1 hour from now
    };
  }
}
