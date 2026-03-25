import { Router } from 'express';
import { notificationController } from '../controllers/notification.controller';
import { authenticate } from '../middleware/auth.middleware';
import { validate } from '../middleware/validate.middleware';
import { asyncHandler } from '../middleware/asyncHandler';
import { v } from '../validators';

const router = Router();

router.post('/gyms/:gymId/notifications/broadcast', authenticate, validate(v.broadcast), asyncHandler(notificationController.broadcast));
router.post('/gyms/:gymId/notifications/expiry',    authenticate,                        asyncHandler(notificationController.notifyExpiring));

export default router;