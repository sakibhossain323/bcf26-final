import { Request, Response, NextFunction } from 'express';
import { logger } from '../utils/logger.js';

let requestCounter = 0;

export const gremlinLatencyMiddleware = (req: Request, res: Response, next: NextFunction) => {
  requestCounter++;

  // Every 5th request gets delayed by 5 seconds (deterministic pattern)
  if (requestCounter % 5 === 0) {
    const delay = 5000;
    logger.warn(`🐛 Gremlin activated! Delaying request #${requestCounter} by ${delay}ms`);

    setTimeout(() => {
      next();
    }, delay);
  } else {
    next();
  }
};