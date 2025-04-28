export {};

declare global {
  namespace Express {
    interface Request {
      ipLocation?: {
        city?: string;
        region?: string;
      };
    }
  }
}
