import { Router } from 'express';
import { classController } from '../controllers/class.controller';
import { authenticate } from '../middleware/auth.middleware';
import { asyncHandler } from '../middleware/asyncHandler';

const router = Router();

// Member self-service
router.get('/me/classes', authenticate, asyncHandler(classController.getMyClasses));

// Gym routes
router.get   ('/gyms/:gymId/classes',                      authenticate, asyncHandler(classController.getAll));
router.post  ('/gyms/:gymId/classes',                      authenticate, asyncHandler(classController.create));
router.get   ('/gyms/:gymId/classes/:classId',             authenticate, asyncHandler(classController.getById));
router.put   ('/gyms/:gymId/classes/:classId',             authenticate, asyncHandler(classController.update));
router.delete('/gyms/:gymId/classes/:classId',             authenticate, asyncHandler(classController.cancel));
router.post  ('/gyms/:gymId/classes/:classId/enroll',      authenticate, asyncHandler(classController.enroll));
router.delete('/gyms/:gymId/classes/:classId/enroll',      authenticate, asyncHandler(classController.unenroll));

export default router;