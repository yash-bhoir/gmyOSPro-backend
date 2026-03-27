import { Router } from 'express';
import { notificationController } from '../controllers/notification.controller';
import { authenticate } from '../middleware/auth.middleware';
import { requireGymAccess, requirePermission } from '../middleware/gym.middleware';
import { validate } from '../middleware/validate.middleware';
import { asyncHandler } from '../middleware/asyncHandler';
import { v } from '../validators';

const router = Router();

// Broadcast notifications — owner, manager only (have 'notifications')
router.post('/gyms/:gymId/notifications/broadcast',
  authenticate, requireGymAccess, requirePermission('notifications'),
  validate(v.broadcast), asyncHandler(notificationController.broadcast));

// Notify expiring members — same permission
router.post('/gyms/:gymId/notifications/expiry',
  authenticate, requireGymAccess, requirePermission('notifications'),
  asyncHandler(notificationController.notifyExpiring));

export default router;
