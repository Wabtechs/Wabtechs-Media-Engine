import Fastify from 'fastify';
import cors from '@fastify/cors';
import multipart from '@fastify/multipart';
import rateLimit from '@fastify/rate-limit';
import { loadEnv } from './config/env.js';
import { createDatabase, closeDatabase } from './infrastructure/database/index.js';
import { getQueue, closeQueue } from './infrastructure/queue/index.js';
import { getStorageProvider, getCdnProvider } from './providers/index.js';
import { MediaService } from './application/media-service.js';
import { UploadService } from './application/upload-service.js';
import { DeliveryService } from './application/delivery-service.js';
import { healthRoutes } from './api/routes/health.js';
import { uploadRoutes } from './api/routes/upload.js';
import { mediaRoutes } from './api/routes/media.js';
import { authMiddleware } from './api/middleware/auth.js';

export function getStorageProviderFromEnv(env: ReturnType<typeof loadEnv>) {
  return getStorageProvider(env);
}

export function getCdnProviderFromEnv(env: ReturnType<typeof loadEnv>) {
  const storage = getStorageProvider(env);
  return getCdnProvider(env, storage);
}

async function main() {
  const env = loadEnv();

  console.log(`[media-engine] Starting on ${env.HOST}:${env.PORT} (${env.NODE_ENV})`);

  const db = createDatabase(env.DATABASE_URL);
  console.log('[media-engine] Database connected');

  const storage = getStorageProvider(env);
  const cdn = getCdnProvider(env, storage);
  const queue = getQueue(env.REDIS_URL);
  console.log('[media-engine] Redis connected');

  const mediaService = new MediaService(storage, cdn, env.REDIS_URL);
  const uploadService = new UploadService(mediaService);
  const deliveryService = new DeliveryService(mediaService, cdn);

  const app = Fastify({
    logger: {
      level: env.NODE_ENV === 'production' ? 'info' : 'debug',
      transport: env.NODE_ENV !== 'production'
        ? { target: 'pino-pretty', options: { colorize: true } }
        : undefined,
    },
  });

  await app.register(cors, {
    origin: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
  });

  await app.register(multipart, {
    limits: {
      fileSize: env.MAX_UPLOAD_SIZE_MB * 1024 * 1024,
    },
  });

  await app.register(rateLimit, {
    max: env.RATE_LIMIT_MAX,
    timeWindow: env.RATE_LIMIT_WINDOW_MS,
  });

  app.decorate('authenticate', authMiddleware);
  app.decorate('db', db);
  app.decorate('mediaService', mediaService);
  app.decorate('uploadService', uploadService);
  app.decorate('deliveryService', deliveryService);
  app.decorate('queue', queue);

  await app.register(healthRoutes);
  await app.register(uploadRoutes);
  await app.register(mediaRoutes);

  app.setErrorHandler((error, _request, reply) => {
    const statusCode = error.statusCode ?? 500;
    app.log.error(error);
    reply.status(statusCode).send({
      error: {
        code: error.code ?? 'INTERNAL_ERROR',
        message: error.message ?? 'An unexpected error occurred',
      },
    });
  });

  try {
    await app.listen({ port: env.PORT, host: env.HOST });
    console.log(`[media-engine] Server running on http://${env.HOST}:${env.PORT}`);
  } catch (err) {
    app.log.error(err);
    process.exit(1);
  }

  const shutdown = async () => {
    console.log('[media-engine] Shutting down...');
    await app.close();
    await closeQueue();
    await closeDatabase();
    process.exit(0);
  };

  process.on('SIGINT', shutdown);
  process.on('SIGTERM', shutdown);
}

main();
