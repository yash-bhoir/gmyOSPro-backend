import { Router } from 'express';
import { analyticsController } from '../controllers/analytics.controller';
import { authenticate } from '../middleware/auth.middleware';
import { asyncHandler } from '../middleware/asyncHandler';

const router = Router();

router.get('/gyms/:gymId/analytics',          authenticate, asyncHandler(analyticsController.fullSummary));
router.get('/gyms/:gymId/analytics/revenue',  authenticate, asyncHandler(analyticsController.revenueByMonth));
router.get('/gyms/:gymId/analytics/growth',   authenticate, asyncHandler(analyticsController.memberGrowth));
router.get('/gyms/:gymId/analytics/checkins', authenticate, asyncHandler(analyticsController.checkinsByDay));
router.get('/gyms/:gymId/analytics/expiring', authenticate, asyncHandler(analyticsController.expiringMembers));
router.get('/gyms/:gymId/analytics/top',      authenticate, asyncHandler(analyticsController.topMembers));

export default router;