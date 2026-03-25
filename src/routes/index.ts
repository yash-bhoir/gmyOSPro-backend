import { Router } from 'express';
import authRoutes         from './auth.routes';
import gymRoutes          from './gym.routes';
import memberRoutes       from './member.routes';
import paymentRoutes      from './payment.routes';
import analyticsRoutes    from './analytics.routes';
import notificationRoutes from './notification.routes';
import staffRoutes        from './staff.routes';
import adminRoutes        from './admin.routes';

const router = Router();

router.use('/auth', authRoutes);
router.use('/',     gymRoutes);
router.use('/',     memberRoutes);
router.use('/',     paymentRoutes);
router.use('/',     analyticsRoutes);
router.use('/',     notificationRoutes);
router.use('/',     staffRoutes);
router.use('/',     adminRoutes);


export default router;