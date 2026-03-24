import { Router } from 'express';
import { gymController } from '../controllers/gym.controller';
import { authenticate } from '../middleware/auth.middleware';

const router = Router();

// Gym CRUD
router.post  ('/gyms',              authenticate, gymController.createGym);
router.get   ('/gyms/my',           authenticate, gymController.getMyGym);
router.put   ('/gyms/:gymId',       authenticate, gymController.updateGym);
router.post  ('/gyms/:gymId/setup-complete', authenticate, gymController.completeSetup);

// Plans
router.get   ('/gyms/:gymId/plans',           authenticate, gymController.getPlans);
router.post  ('/gyms/:gymId/plans',           authenticate, gymController.createPlan);
router.put   ('/gyms/:gymId/plans/:planId',   authenticate, gymController.updatePlan);
router.delete('/gyms/:gymId/plans/:planId',   authenticate, gymController.deletePlan);
router.post  ('/gyms/:gymId/plans/seed',      authenticate, gymController.seedDefaultPlans);

export default router;