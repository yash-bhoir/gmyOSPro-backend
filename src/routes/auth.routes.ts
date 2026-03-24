import { Router } from 'express';
import { authController } from '../controllers/auth.controller';
import { validate } from '../middleware/validate.middleware';
import { authenticate } from '../middleware/auth.middleware';
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
router.post('/otp/send',      otpLimiter, validate(sendOtpSchema),     authController.sendOtp);
router.post('/otp/verify',    validate(verifyOtpSchema),               authController.verifyOtp);

// Email
router.post('/email/login',   validate(emailLoginSchema),              authController.emailLogin);
router.post('/email/register',validate(registerEmailSchema),           authController.registerEmail);

// Token
router.post('/token/refresh', validate(refreshTokenSchema),            authController.refreshToken);

// Protected
router.get  ('/me',           authenticate, authController.getMe);
router.patch('/me',           authenticate, validate(updateProfileSchema), authController.updateProfile);
router.post ('/logout',       authenticate, authController.logout);

export default router;