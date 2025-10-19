import { NextFunction, Request, Response } from 'express';
import { lookup } from 'geoip-lite';

import { NodeEnvs } from '@server/common/constants';
import config from '@server/config';
import { logger } from '@server/services/logger';

// Mock IP address for development environment
const MOCK_IP = '104.244.24.102'; // Monkeybrains IP Address

export function ipGeolocationMiddleware(req: Request, res: Response, next: NextFunction) {
  try {
    // Get IP address from request, use mock IP in development
    const ip = config.env === NodeEnvs.Dev ? MOCK_IP : req.ip || req.socket.remoteAddress;

    if (!ip) {
      next();
      return;
    }

    // Get geolocation data
    const geo = lookup(ip);
    if (geo) {
      req.ipLocation = {
        city: geo.city,
        region: geo.region,
        latitude: geo.ll[0],
        longitude: geo.ll[1],
      };
    }
  } catch (error) {
    // Log error but continue without geolocation data
    logger.error('Error getting IP geolocation:', error);
  }
  next();
}
