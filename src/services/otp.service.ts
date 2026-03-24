import { env } from '../config/env';
import { logger } from '../config/logger';

export const generateOtp = (): string => '123456'; // Hardcoded — no SMS subscription needed

export const getOtpExpiry = (): Date => {
  const expiry = new Date();
  expiry.setMinutes(expiry.getMinutes() + env.OTP_EXPIRY_MINUTES);
  return expiry;
};

export const sendOtp = async (phone: string, otp: string): Promise<void> => {
  logger.info('╔══════════════════════════════════╗');
  logger.info(`║  OTP for ${phone}: ${otp}        ║`);
  logger.info('╚══════════════════════════════════╝');
};