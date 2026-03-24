import { Request, Response } from 'express';
import { authService } from '../services/auth.service';
import { ApiResponse } from '../utils/ApiResponse';

export const authController = {

  sendOtp: async (req: Request, res: Response) => {
    const { phone } = req.body;
    const result = await authService.sendOtp(phone);
    new ApiResponse(200, result.message, { isNewUser: result.isNewUser }).send(res);
  },

  verifyOtp: async (req: Request, res: Response) => {
    const { phone, otp, fullName } = req.body;
    const result = await authService.verifyOtp(phone, otp, fullName);
    new ApiResponse(200, 'Login successful', result).send(res);
  },

  emailLogin: async (req: Request, res: Response) => {
    const { email, password } = req.body;
    const result = await authService.emailLogin(email, password);
    new ApiResponse(200, 'Login successful', result).send(res);
  },

  registerEmail: async (req: Request, res: Response) => {
    const { email, password, fullName, phone } = req.body;
    const result = await authService.registerEmail(email, password, fullName, phone);
    new ApiResponse(201, 'Account created successfully', result).send(res);
  },

  refreshToken: async (req: Request, res: Response) => {
    const { refreshToken } = req.body;
    const result = await authService.refreshToken(refreshToken);
    new ApiResponse(200, 'Token refreshed', result).send(res);
  },

  getMe: async (req: Request, res: Response) => {
    new ApiResponse(200, 'Profile fetched', req.user).send(res);
  },

  updateProfile: async (req: Request, res: Response) => {
    const user = await authService.updateProfile(req.user._id.toString(), req.body);
    new ApiResponse(200, 'Profile updated', user).send(res);
  },

  logout: async (req: Request, res: Response) => {
    await authService.updateProfile(req.user._id.toString(), { fcmToken: '' });
    new ApiResponse(200, 'Logged out successfully').send(res);
  },
};