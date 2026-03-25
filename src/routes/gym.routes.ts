import { Router } from 'express';
import { gymController } from '../controllers/gym.controller';
import { authenticate } from '../middleware/auth.middleware';
import { validate } from '../middleware/validate.middleware';
import { asyncHandler } from '../middleware/asyncHandler';
import { v } from '../validators';

const router = Router();

// Gym CRUD
router.post  ('/gyms',               authenticate, validate(v.createGym), asyncHandler(gymController.createGym));
router.get   ('/gyms/my',            authenticate,                        asyncHandler(gymController.getMyGym));
router.put   ('/gyms/:gymId',        authenticate, validate(v.updateGym), asyncHandler(gymController.updateGym));
router.post  ('/gyms/:gymId/setup-complete', authenticate,               asyncHandler(gymController.completeSetup));

// Plans
router.get   ('/gyms/:gymId/plans',            authenticate,                        asyncHandler(gymController.getPlans));
router.post  ('/gyms/:gymId/plans',            authenticate, validate(v.createPlan),asyncHandler(gymController.createPlan));
router.post  ('/gyms/:gymId/plans/seed',       authenticate,                        asyncHandler(gymController.seedDefaultPlans));
router.put   ('/gyms/:gymId/plans/:planId',    authenticate, validate(v.updatePlan),asyncHandler(gymController.updatePlan));
router.delete('/gyms/:gymId/plans/:planId',    authenticate,                        asyncHandler(gymController.deletePlan));

export default router;