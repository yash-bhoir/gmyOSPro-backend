import { Request, Response, NextFunction } from 'express';
import { ApiError } from '../utils/ApiError';

export const requireSuperAdmin = (req: Request, _res: Response, next: NextFunction) => {
  if (!req.user || req.user.systemRole !== 'super_admin') {
    return next(ApiError.forbidden('Super admin access required'));
  }
  next();
};