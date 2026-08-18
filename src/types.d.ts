import type { FastifyInstance } from 'fastify';
import type { MediaService } from '../application/media-service.js';
import type { UploadService } from '../application/upload-service.js';
import type { DeliveryService } from '../application/delivery-service.js';
import type { Queue } from 'bullmq';

declare module 'fastify' {
  interface FastifyInstance {
    db: ReturnType<typeof import('../infrastructure/database/index.js').getDatabase>;
    mediaService: MediaService;
    uploadService: UploadService;
    deliveryService: DeliveryService;
    queue: Queue;
    authenticate: (request: import('fastify').FastifyRequest, reply: import('fastify').FastifyReply) => Promise<void>;
  }
}
