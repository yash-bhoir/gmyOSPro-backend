import bcrypt from 'bcryptjs';
import { User } from '../models/User.model';
import { ApiError } from '../utils/ApiError';
import { signAccessToken, signRefreshToken, verifyRefreshToken } from '../utils/jwt';
import { generateOtp, getOtpExpiry, sendOtp } from './otp.service';
import { env } from '../config/env';

export const authService = {

  // ── Phone OTP ──
  async sendOtp(phone: string) {
    const otp       = generateOtp();
    const otpExpiry = getOtpExpiry();

    let user = await User.findOne({ phone }).select('+otp +otpExpiry');
    const isNewUser = !user;

    if (!user) {
      user = new User({ phone, fullName: 'New User', otp, otpExpiry });
    } else {
      user.otp       = otp;
      user.otpExpiry = otpExpiry;
    }

    await user.save();
    await sendOtp(phone, otp);
    return { isNewUser, message: 'OTP sent successfully' };
  },

  async verifyOtp(phone: string, otp: string, fullName?: string) {
    const user = await User.findOne({ phone }).select('+otp +otpExpiry');
    if (!user) throw ApiError.notFound('User not found. Please request OTP first.');
    if (!user.otpExpiry || user.otpExpiry < new Date()) {
      throw ApiError.badRequest('OTP has expired. Please request a new one.');
    }
    const isValid = await user.compareOtp(otp);
    if (!isValid) throw ApiError.badRequest('Invalid OTP. Please try again.');

    if (fullName && user.fullName === 'New User') user.fullName = fullName;
    user.otp         = undefined;
    user.otpExpiry   = undefined;
    user.lastLoginAt = new Date();
    await user.save();

    const payload = { userId: user._id.toString(), role: user.systemRole };
    return {
      user: {
        id: user._id, phone: user.phone, fullName: user.fullName,
        email: user.email, role: user.systemRole, photoUrl: user.photoUrl,
      },
      accessToken:  signAccessToken(payload),
      refreshToken: signRefreshToken(payload),
    };
  },

  // ── Email Login ──
  async emailLogin(email: string, password: string) {
    const user = await User.findOne({ email: email.toLowerCase() }).select('+passwordHash');
    if (!user) throw ApiError.badRequest('No account found with this email');
    if (!user.passwordHash) {
      throw ApiError.badRequest('This account uses phone OTP login. Please use OTP instead.');
    }
    const isValid = await bcrypt.compare(password, user.passwordHash);
    if (!isValid) throw ApiError.badRequest('Incorrect password. Please try again.');
    if (!user.isActive) throw ApiError.forbidden('Your account has been deactivated.');

    user.lastLoginAt = new Date();
    await user.save();

    const payload = { userId: user._id.toString(), role: user.systemRole };
    return {
      user: {
        id: user._id, phone: user.phone, fullName: user.fullName,
        email: user.email, role: user.systemRole, photoUrl: user.photoUrl,
      },
      accessToken:  signAccessToken(payload),
      refreshToken: signRefreshToken(payload),
    };
  },

  // ── Email Register ──
  async registerEmail(email: string, password: string, fullName: string, phone?: string) {
    const existing = await User.findOne({ email: email.toLowerCase() });
    if (existing) throw ApiError.badRequest('An account with this email already exists.');

    const passwordHash = await bcrypt.hash(password, env.BCRYPT_ROUNDS);
    const user = await User.create({
      email: email.toLowerCase(),
      passwordHash,
      fullName,
      phone: phone || '',
      systemRole: 'member',
    });

    const payload = { userId: (user._id as any).toString(), role: user.systemRole };
    return {
      user: {
        id: user._id, phone: user.phone, fullName: user.fullName,
        email: user.email, role: user.systemRole,
      },
      accessToken:  signAccessToken(payload),
      refreshToken: signRefreshToken(payload),
    };
  },

  // ── Refresh Token ──
  async refreshToken(token: string) {
    try {
      const payload = verifyRefreshToken(token);
      const user    = await User.findById(payload.userId);
      if (!user || !user.isActive) throw ApiError.unauthorized();
      const newPayload = { userId: user._id.toString(), role: user.systemRole };
      return {
        accessToken:  signAccessToken(newPayload),
        refreshToken: signRefreshToken(newPayload),
      };
    } catch {
      throw ApiError.unauthorized('Invalid or expired refresh token');
    }
  },

  // ── Update Profile ──
  async updateProfile(userId: string, data: { fullName?: string; email?: string; fcmToken?: string }) {
    const user = await User.findByIdAndUpdate(userId, data, { new: true });
    if (!user) throw ApiError.notFound('User not found');
    return user;
  },
};