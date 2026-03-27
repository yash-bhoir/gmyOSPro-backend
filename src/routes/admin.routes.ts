import { Router } from 'express';
import { adminController } from '../controllers/admin.controller';
import { authenticate } from '../middleware/auth.middleware';
import { requireSuperAdmin } from '../middleware/admin.middleware';
import { validate } from '../middleware/validate.middleware';
import { asyncHandler } from '../middleware/asyncHandler';
import { v } from '../validators';

// Sub-router: authenticate + requireSuperAdmin applied only to /admin/* paths
const adminRouter = Router();
adminRouter.use(authenticate, requireSuperAdmin);

// ── Stats & Revenue ──
adminRouter.get  ('/stats',   asyncHandler(adminController.getStats));
adminRouter.get  ('/revenue', asyncHandler(adminController.getRevenueByMonth));

// ── Gym management ──
adminRouter.get  ('/gyms',                asyncHandler(adminController.getAllGyms));
adminRouter.get  ('/gyms/:gymId',         asyncHandler(adminController.getGymDetail));
adminRouter.patch('/gyms/:gymId/status',  validate(v.updateGymStatus), asyncHandler(adminController.updateGymStatus));
adminRouter.patch('/gyms/:gymId/plan',    validate(v.updateGymPlan),   asyncHandler(adminController.updateGymPlan));

// ── User management ──
adminRouter.get   ('/users',              asyncHandler(adminController.getAllUsers));
adminRouter.post  ('/users',              validate(v.createUser),      asyncHandler(adminController.createUser));
adminRouter.patch ('/users/:userId/role', validate(v.updateUserRole),  asyncHandler(adminController.updateUserRole));
adminRouter.delete('/users/:userId',      asyncHandler(adminController.deleteUser));

// ── Create gym owner (user + gym in one shot) ──
adminRouter.post('/gym-owners',   validate(v.createGymOwner),   asyncHandler(adminController.createGymOwner));

// ── Assign staff role to user for a gym ──
adminRouter.post('/assign-role',  validate(v.assignStaffRole),  asyncHandler(adminController.assignStaffRole));

// Mount under /admin so middleware only runs for /admin/* requests
const router = Router();
router.use('/admin', adminRouter);

export default router;
