import dotenv from 'dotenv';
dotenv.config();

const required = (key: string): string => {
  const val = process.env[key];
  if (!val) throw new Error(`Missing required env var: ${key}`);
  return val;
};

const optional = (key: string): string | undefined => process.env[key];

export const env = {
  NODE_ENV:               process.env.NODE_ENV || 'development',
  PORT:                   parseInt(process.env.PORT || '5000'),
  MONGODB_URI:            required('MONGODB_URI'),
  JWT_SECRET:             required('JWT_SECRET'),
  JWT_EXPIRES_IN:         process.env.JWT_EXPIRES_IN || '15m',
  JWT_REFRESH_SECRET:     required('JWT_REFRESH_SECRET'),
  JWT_REFRESH_EXPIRES_IN: process.env.JWT_REFRESH_EXPIRES_IN || '7d',
  BCRYPT_ROUNDS:          parseInt(process.env.BCRYPT_ROUNDS || '12'),
  OTP_EXPIRY_MINUTES:     parseInt(process.env.OTP_EXPIRY_MINUTES || '10'),
  RATE_LIMIT_WINDOW_MS:   parseInt(process.env.RATE_LIMIT_WINDOW_MS || '900000'),
  RATE_LIMIT_MAX:         parseInt(process.env.RATE_LIMIT_MAX || '100'),
  MSG91_AUTH_KEY:         optional('MSG91_AUTH_KEY'),
  MSG91_TEMPLATE_ID:      optional('MSG91_TEMPLATE_ID'),
  MSG91_SENDER_ID:        optional('MSG91_SENDER_ID') || 'GYMOSS',
  RAZORPAY_KEY_ID:        optional('RAZORPAY_KEY_ID'),
  RAZORPAY_KEY_SECRET:    optional('RAZORPAY_KEY_SECRET'),
  isDev:  process.env.NODE_ENV === 'development',
  isProd: process.env.NODE_ENV === 'production',
};