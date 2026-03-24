import { Router } from 'express';
import authRoutes   from './auth.routes';
import memberRoutes from './member.routes';
import gymRoutes    from './gym.routes';

const router = Router();

router.use('/auth', authRoutes);
router.use('/',     gymRoutes);
router.use('/',     memberRoutes);

router.get('/health', (_req, res) => {
  res.json({ success: true, message: 'GymOS API is running', version: '1.0.0', timestamp: new Date().toISOString() });
});

export default router;