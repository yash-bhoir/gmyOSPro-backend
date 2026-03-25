import rateLimit from 'express-rate-limit';
import { env } from '../config/env';

export const globalLimiter = rateLimit({
  windowMs: env.RATE_LIMIT_WINDOW_MS,
  max:      env.RATE_LIMIT_MAX,
  standardHeaders: true,
  legacyHeaders:   false,
  message: { success: false, message: 'Too many requests, please try again later' },
});

export const otpLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max:      env.isDev ? 10 : 3, // 10 in dev, 3 in production
  message: { success: false, message: 'Too many OTP requests, wait 1 minute' },
  standardHeaders: true,
  legacyHeaders:   false,
});