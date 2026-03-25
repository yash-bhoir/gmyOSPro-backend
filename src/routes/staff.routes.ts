import { Router } from 'express';
import { staffController } from '../controllers/staff.controller';
import { authenticate } from '../middleware/auth.middleware';
import { validate } from '../middleware/validate.middleware';
import { asyncHandler } from '../middleware/asyncHandler';
import { v } from '../validators';

const router = Router();

router.get   ('/me/staff-profile',           authenticate,                              asyncHandler(staffController.getMyProfile));
router.get   ('/gyms/:gymId/staff',          authenticate,                              asyncHandler(staffController.getAll));
router.post  ('/gyms/:gymId/staff',          authenticate, validate(v.inviteStaff),     asyncHandler(staffController.invite));
router.patch ('/gyms/:gymId/staff/:staffId', authenticate, validate(v.updateStaffRole), asyncHandler(staffController.updateRole));
router.delete('/gyms/:gymId/staff/:staffId', authenticate,                              asyncHandler(staffController.remove));

export default router;