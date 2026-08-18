import type { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { z } from 'zod';
import { getAuthContext } from '../middleware/auth.js';
import { ALLOWED_IMAGE_MIMES, ALLOWED_VIDEO_MIMES } from '../../domain/utils.js';
import { getEnv } from '../../config/env.js';

const uploadQuerySchema = z.object({
  profile: z.string().optional().default('generic'),
  privacy: z.enum(['public', 'private']).optional().default('private'),
});

export async function uploadRoutes(app: FastifyInstance) {
  app.post('/api/v1/media/upload', {
    preHandler: [app.authenticate],
    handler: async (request: FastifyRequest, reply: FastifyReply) => {
      try {
        const auth = getAuthContext(request);
        const query = uploadQuerySchema.parse(request.query);

        const maxSizeBytes = getEnv().MAX_UPLOAD_SIZE_MB * 1024 * 1024;

        const parts = request.parts();
        let fileData: Buffer | null = null;
        let filename = '';
        let mimeType = '';

        for await (const part of parts) {
          if (part.type === 'file') {
            filename = part.filename;
            mimeType = part.mimetype;

            if (!ALLOWED_IMAGE_MIMES.has(mimeType) && !ALLOWED_VIDEO_MIMES.has(mimeType)) {
              return reply.status(400).send({
                error: {
                  code: 'INVALID_MIME_TYPE',
                  message: `Unsupported file type: ${mimeType}`,
                },
              });
            }

            const chunks: Buffer[] = [];
            let totalSize = 0;

            for await (const chunk of part.file) {
              totalSize += chunk.length;
              if (totalSize > maxSizeBytes) {
                return reply.status(413).send({
                  error: {
                    code: 'FILE_TOO_LARGE',
                    message: `File exceeds maximum size of ${getEnv().MAX_UPLOAD_SIZE_MB}MB`,
                  },
                });
              }
              chunks.push(chunk);
            }

            fileData = Buffer.concat(chunks);
          }
        }

        if (!fileData) {
          return reply.status(400).send({
            error: {
              code: 'NO_FILE',
              message: 'No file provided',
            },
          });
        }

        const mediaService = app['mediaService'];
        const media = await mediaService.upload({
          applicationId: auth.applicationId,
          tenantId: auth.tenantId,
          ownerId: auth.ownerId,
          filename,
          mimeType,
          buffer: fileData,
          profile: query.profile,
          privacy: query.privacy,
        });

        const queue = app['queue'];
        await queue.add('media.optimize', {
          mediaId: media.id,
          profile: query.profile,
          applicationId: auth.applicationId,
          tenantId: auth.tenantId,
        });

        reply.status(201);
        return { data: media };
      } catch (error) {
        const message = error instanceof Error ? error.message : 'Upload failed';
        reply.status(500);
        return { error: { code: 'UPLOAD_FAILED', message } };
      }
    },
  });
}
