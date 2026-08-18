import { createWorker } from '../infrastructure/queue/index.js';
import { getEnv } from '../config/env.js';
import { getDatabase, schema } from '../infrastructure/database/index.js';
import { getStorageProvider, getCdnProvider } from '../index.js';
import { MediaService } from '../application/media-service.js';
import { eq } from 'drizzle-orm';
import { getQueue } from '../infrastructure/queue/index.js';

export function startImageWorker() {
  const env = getEnv();
  const storage = getStorageProvider(env);
  const cdn = getCdnProvider(env, storage);
  const mediaService = new MediaService(storage, cdn, env.REDIS_URL);

  const worker = createWorker(
    env.REDIS_URL,
    'media.optimize',
    async (jobData) => {
      const { mediaId, profile } = jobData as { mediaId: string; profile: string };

      console.log(`[image-worker] Processing media ${mediaId} with profile ${profile}`);

      const result = await mediaService.processImage(mediaId, profile);

      console.log(
        `[image-worker] Completed ${mediaId}: ${result.originalSize} -> ${result.optimizedSize} bytes ` +
        `(${result.compressionRatio.toFixed(1)}% reduction) in ${result.processingTimeMs}ms`,
      );

      return {
        mediaId,
        variantCount: result.variants.length,
        processingTimeMs: result.processingTimeMs,
        compressionRatio: result.compressionRatio,
      };
    },
    env.IMAGE_PROCESSING_CONCURRENCY,
  );

  worker.on('failed', async (job, error) => {
    console.error(`[image-worker] Job ${job?.id} failed:`, error.message);
    if (job) {
      const db = getDatabase();
      const data = job.data as { mediaId: string };
      await db
        .update(schema.media)
        .set({ status: 'failed', updatedAt: new Date() })
        .where(eq(schema.media.id, data.mediaId));
    }
  });

  worker.on('completed', (job) => {
    console.log(`[image-worker] Job ${job.id} completed`);
  });

  return worker;
}

export function startCleanupWorker() {
  const env = getEnv();
  const storage = getStorageProvider(env);

  const worker = createWorker(
    env.REDIS_URL,
    'media.cleanup',
    async (jobData) => {
      const { mediaId } = jobData as { mediaId: string };
      console.log(`[cleanup-worker] Cleaning up media ${mediaId}`);

      const db = getDatabase();
      const variants = await db
        .select()
        .from(schema.mediaVariants)
        .where(eq(schema.mediaVariants.mediaId, mediaId));

      for (const variant of variants) {
        await storage.delete(variant.storageKey);
      }

      await db
        .delete(schema.mediaVariants)
        .where(eq(schema.mediaVariants.mediaId, mediaId));

      console.log(`[cleanup-worker] Cleaned up ${variants.length} variants for ${mediaId}`);
      return { deleted: variants.length };
    },
    1,
  );

  return worker;
}

export function startAllWorkers() {
  const imageWorker = startImageWorker();
  const cleanupWorker = startCleanupWorker();

  console.log('[workers] All workers started');

  return { imageWorker, cleanupWorker };
}
