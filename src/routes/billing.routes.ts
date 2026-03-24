import { Router } from 'express';
import { authenticate } from '../middleware/auth.middleware';

const router = Router();

// Placeholder — will be fully built in next phase
router.get('/', authenticate, (req, res) => {
  res.json({ success: true, message: 'Billing endpoint - coming soon', data: [] });
});

export default router;