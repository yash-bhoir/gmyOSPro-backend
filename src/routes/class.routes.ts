import { Router } from 'express';
import { classController } from '../controllers/class.controller';
import { authenticate } from '../middleware/auth.middleware';
import { requireGymAccess, requirePermission } from '../middleware/gym.middleware';
import { asyncHandler } from '../middleware/asyncHandler';

const router = Router();

// ── Member self-service ──
// Members see classes they are enrolled in (no gymId param needed)
router.get('/me/classes', authenticate, asyncHandler(classController.getMyClasses));

// ── Gym routes ──

// View all classes — any gym staff (and members browsing via gymId)
router.get   ('/gyms/:gymId/classes',
  authenticate, requireGymAccess,
  asyncHandler(classController.getAll));

// View single class — any gym staff
router.get   ('/gyms/:gymId/classes/:classId',
  authenticate, requireGymAccess,
  asyncHandler(classController.getById));

// Create class — owner, manager, trainer (have 'classes')
router.post  ('/gyms/:gymId/classes',
  authenticate, requireGymAccess, requirePermission('classes'),
  asyncHandler(classController.create));

// Update class — owner, manager, trainer
router.put   ('/gyms/:gymId/classes/:classId',
  authenticate, requireGymAccess, requirePermission('classes'),
  asyncHandler(classController.update));

// Cancel class — owner, manager, trainer
router.delete('/gyms/:gymId/classes/:classId',
  authenticate, requireGymAccess, requirePermission('classes'),
  asyncHandler(classController.cancel));

// Enroll / unenroll — any authenticated user (members enroll themselves)
router.post  ('/gyms/:gymId/classes/:classId/enroll',
  authenticate, requireGymAccess,
  asyncHandler(classController.enroll));

router.delete('/gyms/:gymId/classes/:classId/enroll',
  authenticate, requireGymAccess,
  asyncHandler(classController.unenroll));

export default router;
