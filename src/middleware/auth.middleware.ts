import { Request, Response, NextFunction } from 'express';
import { verifyAccessToken } from '../utils/jwt';
import { ApiError } from '../utils/ApiError';
import { User } from '../models/User.model';

declare global {
  namespace Express {
    interface Request {
      user?: any;
      gymId?: string;
    }
  }
}

export const authenticate = async (
  req: Request, res: Response, next: NextFunction
): Promise<void> => {
  const authHeader = req.headers.authorization;
  if (!authHeader?.startsWith('Bearer ')) {
    return next(ApiError.unauthorized('No token provided'));
  }
  const token = authHeader.split(' ')[1];
  try {
    const payload = verifyAccessToken(token);
    const user = await User.findById(payload.userId).select('-otp -otpExpiry');
    if (!user || !user.isActive) {
      return next(ApiError.unauthorized('User not found or inactive'));
    }
    req.user  = user;
    req.gymId = payload.gymId;
    next();
  } catch {
    next(ApiError.unauthorized('Invalid or expired token'));
  }
};

export const authorize = (...roles: string[]) =>
  (req: Request, _res: Response, next: NextFunction) => {
    if (!req.user || !roles.includes(req.user.systemRole)) {
      return next(ApiError.forbidden('Insufficient permissions'));
    }
    next();
  };

// Alias — used in admin.routes.ts
export const requireRole = authorize;