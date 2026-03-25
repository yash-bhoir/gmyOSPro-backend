import { Router } from 'express';
import { authController } from '../controllers/auth.controller';
import { validate } from '../middleware/validate.middleware';
import { authenticate } from '../middleware/auth.middleware';
import { asyncHandler } from '../middleware/asyncHandler';
import { otpLimiter } from '../middleware/rateLimiter';
import {
  sendOtpSchema,
  verifyOtpSchema,
  refreshTokenSchema,
  updateProfileSchema,
  emailLoginSchema,
  registerEmailSchema,
} from '../validators/auth.validator';

const router = Router();

// Phone OTP
router.post('/otp/send',       otpLimiter, validate(sendOtpSchema),      asyncHandler(authController.sendOtp));
router.post('/otp/verify',     validate(verifyOtpSchema),                asyncHandler(authController.verifyOtp));

// Email
router.post('/email/login',    validate(emailLoginSchema),               asyncHandler(authController.emailLogin));
router.post('/email/register', validate(registerEmailSchema),            asyncHandler(authController.registerEmail));

// Token
router.post('/token/refresh',  validate(refreshTokenSchema),             asyncHandler(authController.refreshToken));

// Protected
router.get ('/me',             authenticate,                             asyncHandler(authController.getMe));
router.patch('/me',            authenticate, validate(updateProfileSchema), asyncHandler(authController.updateProfile));
router.post('/logout',         authenticate,                             asyncHandler(authController.logout));

export default router;