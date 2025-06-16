import { CaptchaService } from '../captcha';
import { ChallengeTuple } from '@cap.js/server';

export class FakeCaptchaService extends CaptchaService {
  async validateToken(_token: string): Promise<{ success: boolean }> {
    return { success: true };
  }

  async redeemChallenge(_token: string, _solutions: [string, string, string][]): Promise<{ success: boolean }> {
    return { success: true };
  }

  async createChallenge(): Promise<{ challenge: ChallengeTuple[]; token?: string; expires: number }> {
    return {
      challenge: [['test', 'test']],
      token: 'fake-token',
      expires: Date.now() + 3600000, // 1 hour from now
    };
  }
}
