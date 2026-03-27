import { Request, Response, NextFunction } from 'express';
import { Gym } from '../models/Gym.model';
import { StaffMember } from '../models/StaffMember.model';
import { Member } from '../models/Member.model';
import { ApiError } from '../utils/ApiError';
import mongoose from 'mongoose';

/**
 * Verifies the requesting user belongs to the gym as owner or active staff.
 * Attaches req.gymId and (if staff) req.staffProfile.
 * Super admin bypasses all checks.
 */
export const requireGymAccess = async (
  req: Request, _res: Response, next: NextFunction
): Promise<void> => {
  try {
    if (req.user?.systemRole === 'super_admin') return next();

    const gymId = req.params.gymId as string;
    if (!gymId || !mongoose.Types.ObjectId.isValid(gymId)) {
      return next(ApiError.badRequest('Invalid gym ID'));
    }

    const userId = req.user._id.toString();

    const gym = await Gym.findById(gymId).select('ownerId isActive');
    if (!gym || !gym.isActive) return next(ApiError.notFound('Gym not found'));

    // Owner has full access
    if (gym.ownerId.toString() === userId) {
      req.gymId = gymId;
      return next();
    }

    // Active staff member check
    const staff = await StaffMember.findOne({ gymId, userId, isActive: true });
    if (staff) {
      req.gymId = gymId;
      (req as any).staffProfile = staff;
      return next();
    }

    // Active gym member check
    const member = await Member.findOne({ gymId, userId, isActive: true });
    if (!member) return next(ApiError.forbidden('You do not have access to this gym'));

    req.gymId = gymId;
    next();
  } catch (err) {
    next(err);
  }
};

/**
 * Only the gym owner (or super_admin) can proceed.
 */
export const requireGymOwner = async (
  req: Request, _res: Response, next: NextFunction
): Promise<void> => {
  try {
    if (req.user?.systemRole === 'super_admin') return next();

    const gymId = req.params.gymId as string;
    if (!gymId || !mongoose.Types.ObjectId.isValid(gymId)) {
      return next(ApiError.badRequest('Invalid gym ID'));
    }

    const userId = req.user._id.toString();

    const gym = await Gym.findById(gymId).select('ownerId isActive');
    if (!gym || !gym.isActive) return next(ApiError.notFound('Gym not found'));

    if (gym.ownerId.toString() !== userId) {
      return next(ApiError.forbidden('Only the gym owner can perform this action'));
    }

    req.gymId = gymId;
    next();
  } catch (err) {
    next(err);
  }
};

/**
 * Checks that the authenticated staff member has the given permission.
 * Must be placed AFTER requireGymAccess (so req.staffProfile may already be set).
 * Owner and super_admin always pass.
 *
 * Permission hierarchy: having the parent grant ('members') satisfies
 * any sub-permission check ('members:read', 'members:add', 'members:edit').
 */
export const requirePermission = (permission: string) =>
  async (req: Request, _res: Response, next: NextFunction): Promise<void> => {
    try {
      if (req.user?.systemRole === 'super_admin') return next();

      const gymId  = req.params.gymId as string;
      const userId = req.user._id.toString();

      const gym = await Gym.findById(gymId).select('ownerId');
      if (!gym) return next(ApiError.notFound('Gym not found'));

      // Owner has all permissions
      if (gym.ownerId.toString() === userId) return next();

      // Use cached staffProfile from requireGymAccess if available
      const staff = (req as any).staffProfile
        ?? await StaffMember.findOne({ gymId, userId, isActive: true });

      if (!staff) return next(ApiError.forbidden('Access denied'));

      if (staff.permissions.includes('*')) return next();

      // Check: exact match OR staff holds the parent scope
      const hasPermission = staff.permissions.some((p: string) =>
        p === permission || p === permission.split(':')[0]
      );

      if (!hasPermission) {
        return next(ApiError.forbidden('You do not have permission to perform this action'));
      }

      next();
    } catch (err) {
      next(err);
    }
  };
