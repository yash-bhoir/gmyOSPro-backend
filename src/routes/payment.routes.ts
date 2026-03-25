import { Router } from 'express';
import { paymentController } from '../controllers/payment.controller';
import { authenticate } from '../middleware/auth.middleware';
import { validate } from '../middleware/validate.middleware';
import { asyncHandler } from '../middleware/asyncHandler';
import { v } from '../validators';

const router = Router();

// Member
router.get('/me/invoices', authenticate, asyncHandler(paymentController.getMyInvoices));

// Staff
router.get ('/gyms/:gymId/invoices',                 authenticate,                             asyncHandler(paymentController.getInvoices));
router.post('/gyms/:gymId/invoices',                 authenticate, validate(v.createInvoice),  asyncHandler(paymentController.createInvoice));
router.post('/gyms/:gymId/invoices/:invoiceId/pay',  authenticate, validate(v.recordPayment),  asyncHandler(paymentController.recordPayment));
router.get ('/gyms/:gymId/revenue',                  authenticate,                             asyncHandler(paymentController.getRevenueStats));

// Razorpay
router.post('/gyms/:gymId/razorpay/order',           authenticate, validate(v.createRazorpayOrder), asyncHandler(paymentController.createRazorpayOrder));
router.post('/gyms/:gymId/razorpay/verify',          authenticate, validate(v.verifyPayment),       asyncHandler(paymentController.verifyPayment));

export default router;