import winston from 'winston';
import { env } from './env';

const { combine, timestamp, colorize, printf, json } = winston.format;

const devFormat = printf(({ level, message, timestamp: ts, ...meta }) => {
  const metaStr = Object.keys(meta).length
    ? '\n' + JSON.stringify(meta, null, 2)
    : '';
  return `${ts} [${level}]: ${message}${metaStr}`;
});

export const logger = winston.createLogger({
  level: env.isDev ? 'debug' : 'info',
  format: env.isDev
    ? combine(colorize(), timestamp({ format: 'HH:mm:ss' }), devFormat)
    : combine(timestamp(), json()),
  transports: [
    new winston.transports.Console(),
    ...(env.isProd
      ? [new winston.transports.File({ filename: 'logs/error.log', level: 'error' })]
      : []),
  ],
});