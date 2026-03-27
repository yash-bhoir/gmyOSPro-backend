import { Router } from 'express';
import { staffController } from '../controllers/staff.controller';
import { authenticate } from '../middleware/auth.middleware';
import { requireGymAccess, requireGymOwner } from '../middleware/gym.middleware';
import { validate } from '../middleware/validate.middleware';
import { asyncHandler } from '../middleware/asyncHandler';
import { v } from '../validators';

const router = Router();

// Self-service — get own staff profile
router.get   ('/me/staff-profile', authenticate, asyncHandler(staffController.getMyProfile));

// View staff list — any gym staff can see who else is on the team
router.get   ('/gyms/:gymId/staff',          authenticate, requireGymAccess,  asyncHandler(staffController.getAll));

// Invite / update role / remove — gym owner only
router.post  ('/gyms/:gymId/staff',          authenticate, requireGymOwner, validate(v.inviteStaff),      asyncHandler(staffController.invite));
router.patch ('/gyms/:gymId/staff/:staffId', authenticate, requireGymOwner, validate(v.updateStaffRole),  asyncHandler(staffController.updateRole));
router.delete('/gyms/:gymId/staff/:staffId', authenticate, requireGymOwner,                               asyncHandler(staffController.remove));

export default router;
