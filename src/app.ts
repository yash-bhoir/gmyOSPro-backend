import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import rateLimit from 'express-rate-limit';
import { errorHandler, notFoundHandler } from './middleware/error.middleware';
import router from './routes';
import { logger } from './config/logger';

const app = express();

// ── Security ──
app.use(helmet());
app.use(cors({
  origin: '*',
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));

// ── Rate limiting ──
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  message: { success: false, message: 'Too many requests, please try again later' },
  standardHeaders: true,
  legacyHeaders: false,
});

const otpLimiter = rateLimit({
  windowMs: 10 * 60 * 1000,
  max: 5,
  message: { success: false, message: 'Too many OTP requests, please wait 10 minutes' },
});

// app.use('/api/v1/auth/otp', otpLimiter);
app.use('/api/', limiter);

// ── Body parsing ──
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// ── Logging ──
if (process.env.NODE_ENV !== 'test') {
  app.use(morgan('combined', {
    stream: { write: (message) => logger.info(message.trim()) },
  }));
}

// ── Health check — PUBLIC, no auth required ──
app.get('/api/v1/health', (_req, res) => {
  res.json({
    success:   true,
    message:   'GymOS API is running',
    version:   '1.0.0',
    timestamp: new Date().toISOString(),
  });
});

// ── All other routes ──
app.use('/api/v1', router);

// ── 404 handler — MUST be after all routes ──
app.use(notFoundHandler);

// ── Global error handler — MUST be last ──
app.use(errorHandler);

export default app;