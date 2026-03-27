import { Router } from 'express';
import { analyticsController } from '../controllers/analytics.controller';
import { authenticate } from '../middleware/auth.middleware';
import { requireGymAccess, requirePermission } from '../middleware/gym.middleware';
import { asyncHandler } from '../middleware/asyncHandler';

const router = Router();

// All analytics routes: gym access + reports permission
// Access: owner, manager, accounts (have 'reports'); trainer / front_desk blocked
router.get('/gyms/:gymId/analytics',          authenticate, requireGymAccess, requirePermission('reports'), asyncHandler(analyticsController.fullSummary));
router.get('/gyms/:gymId/analytics/revenue',  authenticate, requireGymAccess, requirePermission('reports'), asyncHandler(analyticsController.revenueByMonth));
router.get('/gyms/:gymId/analytics/growth',   authenticate, requireGymAccess, requirePermission('reports'), asyncHandler(analyticsController.memberGrowth));
router.get('/gyms/:gymId/analytics/checkins', authenticate, requireGymAccess, requirePermission('reports'), asyncHandler(analyticsController.checkinsByDay));
router.get('/gyms/:gymId/analytics/expiring', authenticate, requireGymAccess, requirePermission('reports'), asyncHandler(analyticsController.expiringMembers));
router.get('/gyms/:gymId/analytics/top',      authenticate, requireGymAccess, requirePermission('reports'), asyncHandler(analyticsController.topMembers));

export default router;
