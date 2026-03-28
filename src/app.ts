import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import compression from 'compression';
import rateLimit from 'express-rate-limit';
import { errorHandler, notFoundHandler } from './middleware/error.middleware';
import router from './routes';
import { logger } from './config/logger';
import { env } from './config/env';

const app = express();

// ── Security ──
app.use(helmet());
app.set('trust proxy', 1);

// ── CORS ──
const webOrigins = ['https://gymos.in', 'https://www.gymos.in', 'https://app.gymos.in'];

app.use(cors({
  origin: (origin, callback) => {
    // Allow requests with no origin (mobile apps, curl, Postman)
    if (!origin) return callback(null, true);
    // Allow all origins in dev
    if (env.isDev) return callback(null, true);
    // Allow known web origins in prod
    if (webOrigins.includes(origin)) return callback(null, true);
    callback(new Error('Not allowed by CORS'));
  },
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true,
}));

// ── Compression ──
app.use(compression());

// ── Rate limiting ──
const limiter = rateLimit({
  windowMs: env.RATE_LIMIT_WINDOW_MS,
  max:      env.RATE_LIMIT_MAX,
  message:  { success: false, message: 'Too many requests, please try again later' },
  standardHeaders: true,
  legacyHeaders:   false,
});

const otpLimiter = rateLimit({
  windowMs: 10 * 60 * 1000,
  max: env.isDev ? 100 : 5,
  message: { success: false, message: 'Too many OTP requests, please wait 10 minutes' },
  standardHeaders: true,
  legacyHeaders:   false,
});

app.use('/api/', limiter);
app.use('/api/v1/auth/otp', otpLimiter);

// ── Body parsing ──
app.use(express.json({ limit: '5mb' }));
app.use(express.urlencoded({ extended: true, limit: '5mb' }));

// ── Logging ──
if (process.env.NODE_ENV !== 'test') {
  app.use(morgan(env.isDev ? 'dev' : 'combined', {
    stream: { write: (message) => logger.info(message.trim()) },
  }));
}

// ── Health check — PUBLIC, no auth required ──
app.get('/api/v1/health', (_req, res) => {
  res.json({
    success:   true,
    message:   'GymOS API is running',
    version:   '1.0.0',
    env:       env.NODE_ENV,
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
