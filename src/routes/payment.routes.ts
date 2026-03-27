import { Router } from 'express';
import { paymentController } from '../controllers/payment.controller';
import { authenticate } from '../middleware/auth.middleware';
import { requireGymAccess, requirePermission } from '../middleware/gym.middleware';
import { validate } from '../middleware/validate.middleware';
import { asyncHandler } from '../middleware/asyncHandler';
import { v } from '../validators';

const router = Router();

// ── Member self-service ──
router.get('/me/invoices', authenticate, asyncHandler(paymentController.getMyInvoices));

// ── Gym staff routes ──

// View invoices — owner, manager, front_desk, accounts (billing:read or billing)
router.get ('/gyms/:gymId/invoices',
  authenticate, requireGymAccess, requirePermission('billing:read'),
  asyncHandler(paymentController.getInvoices));

// Create invoice — owner, manager, front_desk, accounts (billing:collect or billing)
router.post('/gyms/:gymId/invoices',
  authenticate, requireGymAccess, requirePermission('billing:collect'),
  validate(v.createInvoice), asyncHandler(paymentController.createInvoice));

// Record payment — same as create invoice
router.post('/gyms/:gymId/invoices/:invoiceId/pay',
  authenticate, requireGymAccess, requirePermission('billing:collect'),
  validate(v.recordPayment), asyncHandler(paymentController.recordPayment));

// Revenue stats — owner, manager, accounts (reports permission)
router.get ('/gyms/:gymId/revenue',
  authenticate, requireGymAccess, requirePermission('reports'),
  asyncHandler(paymentController.getRevenueStats));

// ── Razorpay ── (billing:collect required)
router.post('/gyms/:gymId/razorpay/order',
  authenticate, requireGymAccess, requirePermission('billing:collect'),
  validate(v.createRazorpayOrder), asyncHandler(paymentController.createRazorpayOrder));

router.post('/gyms/:gymId/razorpay/verify',
  authenticate, requireGymAccess, requirePermission('billing:collect'),
  validate(v.verifyPayment), asyncHandler(paymentController.verifyPayment));

export default router;
