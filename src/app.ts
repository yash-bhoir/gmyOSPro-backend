import 'express-async-errors';
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import compression from 'compression';
import { env } from './config/env';
import routes from './routes';
import { globalLimiter } from './middleware/rateLimiter';
import { errorHandler, notFoundHandler } from './middleware/error.middleware';

const app = express();

// Security headers
app.use(helmet());

// CORS
app.use(
  cors({
    origin: env.isDev ? '*' : ['https://gymos.in'],
    credentials: true,
  })
);

// Rate limiting
app.use(globalLimiter);

// Compression
app.use(compression());

// Body parsing
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// HTTP request logging
if (env.isDev) {
  app.use(morgan('dev'));
}

// API routes
app.use('/api/v1', routes);

// Error handling — must be LAST
app.use(notFoundHandler);
app.use(errorHandler);

export default app;