import type { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { z } from 'zod';
import { getAuthContext } from '../middleware/auth.js';

const paramsSchema = z.object({
  id: z.string().min(1),
});

const querySchema = z.object({
  width: z.coerce.number().int().positive().optional(),
  variant: z.enum(['thumbnail', 'small', 'medium', 'large', 'original']).optional(),
});

export async function mediaRoutes(app: FastifyInstance) {
  app.get('/api/v1/media/:id', {
    preHandler: [app.authenticate],
    handler: async (request: FastifyRequest, reply: FastifyReply) => {
      const auth = getAuthContext(request);
      const { id } = paramsSchema.parse(request.params);
      const mediaService = app['mediaService'];

      const media = await mediaService.getById(id);
      if (!media) {
        return reply.status(404).send({
          error: { code: 'NOT_FOUND', message: 'Media not found' },
        });
      }

      if (media.tenantId !== auth.tenantId || media.applicationId !== auth.applicationId) {
        return reply.status(403).send({
          error: { code: 'FORBIDDEN', message: 'Access denied' },
        });
      }

      const variants = await mediaService.getVariants(id);
      return { data: { ...media, variants } };
    },
  });

  app.get('/api/v1/media/:id/variants', {
    preHandler: [app.authenticate],
    handler: async (request: FastifyRequest, reply: FastifyReply) => {
      const auth = getAuthContext(request);
      const { id } = paramsSchema.parse(request.params);
      const mediaService = app['mediaService'];

      const media = await mediaService.getById(id);
      if (!media || media.tenantId !== auth.tenantId) {
        return reply.status(404).send({
          error: { code: 'NOT_FOUND', message: 'Media not found' },
        });
      }

      const variants = await mediaService.getVariants(id);
      return { data: variants };
    },
  });

  app.get('/api/v1/media/:id/url', {
    preHandler: [app.authenticate],
    handler: async (request: FastifyRequest, reply: FastifyReply) => {
      const auth = getAuthContext(request);
      const { id } = paramsSchema.parse(request.params);
      const query = querySchema.parse(request.query);
      const mediaService = app['mediaService'];

      const media = await mediaService.getById(id);
      if (!media || media.tenantId !== auth.tenantId) {
        return reply.status(404).send({
          error: { code: 'NOT_FOUND', message: 'Media not found' },
        });
      }

      const url = await mediaService.getUrl(id, query);
      if (!url) {
        return reply.status(404).send({
          error: { code: 'NO_VARIANTS', message: 'No variants available' },
        });
      }

      return { data: { url } };
    },
  });

  app.delete('/api/v1/media/:id', {
    preHandler: [app.authenticate],
    handler: async (request: FastifyRequest, reply: FastifyReply) => {
      const auth = getAuthContext(request);
      const { id } = paramsSchema.parse(request.params);
      const mediaService = app['mediaService'];

      const deleted = await mediaService.softDelete(id, auth.applicationId, auth.tenantId);
      if (!deleted) {
        return reply.status(404).send({
          error: { code: 'NOT_FOUND', message: 'Media not found or access denied' },
        });
      }

      return { data: { deleted: true } };
    },
  });

  app.post('/api/v1/media/:id/process', {
    preHandler: [app.authenticate],
    handler: async (request: FastifyRequest, reply: FastifyReply) => {
      const auth = getAuthContext(request);
      const { id } = paramsSchema.parse(request.params);
      const body = z.object({ profile: z.string().optional().default('generic') }).parse(request.body);
      const mediaService = app['mediaService'];

      const media = await mediaService.getById(id);
      if (!media || media.tenantId !== auth.tenantId) {
        return reply.status(404).send({
          error: { code: 'NOT_FOUND', message: 'Media not found' },
        });
      }

      const queue = app['queue'];
      await queue.add('media.optimize', {
        mediaId: id,
        profile: body.profile,
        applicationId: auth.applicationId,
        tenantId: auth.tenantId,
      });

      return { data: { queued: true, mediaId: id } };
    },
  });

  app.get('/api/v1/media', {
    preHandler: [app.authenticate],
    handler: async (request: FastifyRequest) => {
      const auth = getAuthContext(request);
      const query = z
        .object({
          limit: z.coerce.number().int().min(1).max(100).optional().default(20),
          cursor: z.string().optional(),
        })
        .parse(request.query);

      const mediaService = app['mediaService'];
      const result = await mediaService.listByApplication(
        auth.applicationId,
        auth.tenantId,
        query,
      );

      return { data: result.items, nextCursor: result.nextCursor };
    },
  });
}
