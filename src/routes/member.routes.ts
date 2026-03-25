import { Router } from 'express';
import { memberController } from '../controllers/member.controller';
import { authenticate } from '../middleware/auth.middleware';
import { validate } from '../middleware/validate.middleware';
import { asyncHandler } from '../middleware/asyncHandler';
import { v } from '../validators';

const router = Router();

// Member self-service
router.get('/me/member-profile', authenticate,                          asyncHandler(memberController.getMyProfile));
router.get('/me/qr-token',       authenticate,                          asyncHandler(memberController.getQrToken));
router.get('/me/attendance',     authenticate,                          asyncHandler(memberController.getAttendance));

// Gym staff routes
router.get ('/gyms/:gymId/members',                   authenticate,                          asyncHandler(memberController.getAll));
router.post('/gyms/:gymId/members',                   authenticate, validate(v.createMember),asyncHandler(memberController.create));
router.get ('/gyms/:gymId/members/:memberId',         authenticate,                          asyncHandler(memberController.getById));
router.put ('/gyms/:gymId/members/:memberId',         authenticate, validate(v.updateMember),asyncHandler(memberController.update));
router.post('/gyms/:gymId/members/:memberId/checkin', authenticate, validate(v.checkin),     asyncHandler(memberController.checkin));
router.get ('/gyms/:gymId/dashboard',                 authenticate,                          asyncHandler(memberController.getDashboardStats));

export default router;