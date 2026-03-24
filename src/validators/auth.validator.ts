import Joi from 'joi';

export const sendOtpSchema = Joi.object({
  phone: Joi.string()
    .pattern(/^[6-9]\d{9}$/)
    .required()
    .messages({
      'string.pattern.base': 'Enter a valid 10-digit Indian mobile number',
      'any.required': 'Phone number is required',
    }),
});

export const verifyOtpSchema = Joi.object({
  phone:    Joi.string().pattern(/^[6-9]\d{9}$/).required(),
  otp:      Joi.string().length(6).pattern(/^\d+$/).required(),
  fullName: Joi.string().min(2).max(100).optional(),
});

export const refreshTokenSchema = Joi.object({
  refreshToken: Joi.string().required(),
});

export const updateProfileSchema = Joi.object({
  fullName: Joi.string().min(2).max(100).optional(),
  email:    Joi.string().email().optional(),
  fcmToken: Joi.string().optional(),
});

export const emailLoginSchema = Joi.object({
  email:    Joi.string().email().required().messages({
    'string.email': 'Enter a valid email address',
    'any.required': 'Email is required',
  }),
  password: Joi.string().min(6).required().messages({
    'string.min': 'Password must be at least 6 characters',
    'any.required': 'Password is required',
  }),
});

export const registerEmailSchema = Joi.object({
  email:    Joi.string().email().required(),
  password: Joi.string().min(6).required(),
  fullName: Joi.string().min(2).max(100).required(),
  phone:    Joi.string().pattern(/^[6-9]\d{9}$/).optional().allow(''),
});