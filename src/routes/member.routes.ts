import { Router } from 'express';
import { memberController } from '../controllers/member.controller';
import { authenticate } from '../middleware/auth.middleware';

const router = Router();

// Member self-service (authenticated member)
router.get('/me/member-profile', authenticate, memberController.getMyProfile);
router.get('/me/qr-token',       authenticate, memberController.getQrToken);
router.get('/me/attendance',     authenticate, memberController.getAttendance);

// Gym staff routes
router.get ('/gyms/:gymId/members',             authenticate, memberController.getAll);
router.post('/gyms/:gymId/members',             authenticate, memberController.create);
router.get ('/gyms/:gymId/members/:memberId',   authenticate, memberController.getById);
router.put ('/gyms/:gymId/members/:memberId',   authenticate, memberController.update);
router.post('/gyms/:gymId/members/:memberId/checkin', authenticate, memberController.checkin);
router.get ('/gyms/:gymId/dashboard',           authenticate, memberController.getDashboardStats);

export default router;