import app        from './src/app';
import { connectDB } from './src/config/db';
import { env }    from './src/config/env';
import { logger } from './src/config/logger';

const startServer = async () => {
  // Connect to MongoDB first
  await connectDB();

  const server = app.listen(env.PORT, () => {
    logger.info(`🚀 GymOS API running on port ${env.PORT} [${env.NODE_ENV}]`);
    logger.info(`📋 Health check: http://localhost:${env.PORT}/api/v1/health`);
  });

  // Graceful shutdown
  const shutdown = (signal: string) => {
    logger.info(`${signal} received — shutting down gracefully`);
    server.close(() => {
      logger.info('HTTP server closed');
      process.exit(0);
    });
  };

  process.on('SIGTERM', () => shutdown('SIGTERM'));
  process.on('SIGINT',  () => shutdown('SIGINT'));
  process.on('uncaughtException', (err) => {
    logger.error('Uncaught exception:', err);
    process.exit(1);
  });
  process.on('unhandledRejection', (reason) => {
    logger.error('Unhandled rejection:', reason);
    process.exit(1);
  });
};

startServer().catch((err) => {
  console.error('Failed to start server:', err);
  process.exit(1);
});