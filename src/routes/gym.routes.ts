import { Router } from 'express';
import { gymController } from '../controllers/gym.controller';
import { authenticate } from '../middleware/auth.middleware';
import { requireGymAccess, requireGymOwner } from '../middleware/gym.middleware';
import { validate } from '../middleware/validate.middleware';
import { asyncHandler } from '../middleware/asyncHandler';
import { v } from '../validators';

const router = Router();

// ── Gym CRUD ──
// Any authenticated user can create their own gym
router.post  ('/gyms',               authenticate, validate(v.createGym), asyncHandler(gymController.createGym));
// Owner gets their own gym — no gymId param, no ownership check needed
router.get   ('/gyms/my',            authenticate,                        asyncHandler(gymController.getMyGym));
// Only gym owner can edit gym profile
router.put   ('/gyms/:gymId',        authenticate, requireGymOwner, validate(v.updateGym), asyncHandler(gymController.updateGym));
// Only gym owner can mark setup complete
router.post  ('/gyms/:gymId/setup-complete', authenticate, requireGymOwner, asyncHandler(gymController.completeSetup));

// ── Plans ──
// Any gym staff can view plans
router.get   ('/gyms/:gymId/plans',            authenticate, requireGymAccess,                             asyncHandler(gymController.getPlans));
// Only gym owner can create / edit / delete / seed plans
router.post  ('/gyms/:gymId/plans',            authenticate, requireGymOwner, validate(v.createPlan),      asyncHandler(gymController.createPlan));
router.post  ('/gyms/:gymId/plans/seed',       authenticate, requireGymOwner,                              asyncHandler(gymController.seedDefaultPlans));
router.put   ('/gyms/:gymId/plans/:planId',    authenticate, requireGymOwner, validate(v.updatePlan),      asyncHandler(gymController.updatePlan));
router.delete('/gyms/:gymId/plans/:planId',    authenticate, requireGymOwner,                              asyncHandler(gymController.deletePlan));

export default router;
