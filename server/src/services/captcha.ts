import Cap from '@cap.js/server';

export class CaptchaService {
  private cap: Cap;

  constructor() {
    this.cap = new Cap({
      tokens_store_path: '.data/tokensList.json',
    });
  }

  async validateToken(token: string): Promise<{ success: boolean }> {
    return this.cap.validateToken(token);
  }

  async redeemChallenge(token: string, solutions: number[]): Promise<{ success: boolean }> {
    return this.cap.redeemChallenge({ token, solutions });
  }

  async createChallenge(): Promise<{
    challenge: {
      c: number;
      s: number;
      d: number;
    };
    token?: string;
    expires: number;
  }> {
    return this.cap.createChallenge();
  }
}
