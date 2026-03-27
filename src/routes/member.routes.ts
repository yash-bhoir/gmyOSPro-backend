import { Router } from 'express';
import { memberController } from '../controllers/member.controller';
import { authenticate } from '../middleware/auth.middleware';
import { requireGymAccess, requirePermission } from '../middleware/gym.middleware';
import { validate } from '../middleware/validate.middleware';
import { asyncHandler } from '../middleware/asyncHandler';
import { v } from '../validators';

const router = Router();

// ── Member self-service (no gymId needed) ──
router.get('/me/member-profile', authenticate, asyncHandler(memberController.getMyProfile));
router.get('/me/qr-token',       authenticate, asyncHandler(memberController.getQrToken));
router.get('/me/attendance',     authenticate, asyncHandler(memberController.getAttendance));

// ── Gym staff routes ──

// Dashboard — any gym staff can see KPIs
router.get ('/gyms/:gymId/dashboard', authenticate, requireGymAccess, asyncHandler(memberController.getDashboardStats));

// View members — owner, manager, trainer, front_desk (all have members:read or members)
router.get ('/gyms/:gymId/members',
  authenticate, requireGymAccess, requirePermission('members:read'),
  asyncHandler(memberController.getAll));

// Add member — owner, manager, front_desk (have members or members:add)
router.post('/gyms/:gymId/members',
  authenticate, requireGymAccess, requirePermission('members:add'),
  validate(v.createMember), asyncHandler(memberController.create));

// View single member — same as list
router.get ('/gyms/:gymId/members/:memberId',
  authenticate, requireGymAccess, requirePermission('members:read'),
  asyncHandler(memberController.getById));

// Edit member — owner, manager only (have members which grants members:edit)
router.put ('/gyms/:gymId/members/:memberId',
  authenticate, requireGymAccess, requirePermission('members:edit'),
  validate(v.updateMember), asyncHandler(memberController.update));

// Check-in — owner, manager, trainer, front_desk (all have checkin)
router.post('/gyms/:gymId/members/:memberId/checkin',
  authenticate, requireGymAccess, requirePermission('checkin'),
  validate(v.checkin), asyncHandler(memberController.checkin));

export default router;
