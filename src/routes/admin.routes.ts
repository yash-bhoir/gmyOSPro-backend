import { Router } from 'express';
import { adminController } from '../controllers/admin.controller';
import { authenticate } from '../middleware/auth.middleware';
import { requireSuperAdmin } from '../middleware/admin.middleware';
import { validate } from '../middleware/validate.middleware';
import { asyncHandler } from '../middleware/asyncHandler';
import { v } from '../validators';

const router = Router();

router.use(authenticate, requireSuperAdmin);

// Stats & Revenue
router.get  ('/admin/stats',                asyncHandler(adminController.getStats));
router.get  ('/admin/revenue',              asyncHandler(adminController.getRevenueByMonth));

// Gym management
router.get  ('/admin/gyms',                 asyncHandler(adminController.getAllGyms));
router.get  ('/admin/gyms/:gymId',          asyncHandler(adminController.getGymDetail));
router.patch('/admin/gyms/:gymId/status',   validate(v.updateGymStatus), asyncHandler(adminController.updateGymStatus));
router.patch('/admin/gyms/:gymId/plan',     validate(v.updateGymPlan),   asyncHandler(adminController.updateGymPlan));

// User management
router.get  ('/admin/users',                asyncHandler(adminController.getAllUsers));
router.post ('/admin/users',                asyncHandler(adminController.createUser));
router.patch('/admin/users/:userId/role',   asyncHandler(adminController.updateUserRole));
router.delete('/admin/users/:userId',       asyncHandler(adminController.deleteUser));

// Create gym owner (creates user + gym in one shot)
router.post ('/admin/gym-owners',           asyncHandler(adminController.createGymOwner));

// Assign staff role to user for a gym
router.post ('/admin/assign-role',          asyncHandler(adminController.assignStaffRole));

export default router;