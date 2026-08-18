import type { FastifyInstance } from 'fastify';

export async function healthRoutes(app: FastifyInstance) {
  app.get('/health', async () => {
    return { status: 'ok', service: 'wabtechs-media-engine', timestamp: new Date().toISOString() };
  });

  app.get('/ready', async (_request, reply) => {
    try {
      const db = app['db'];
      if (db) {
        await db.execute({ sql: 'SELECT 1' });
      }
      return { status: 'ready', timestamp: new Date().toISOString() };
    } catch {
      reply.status(503);
      return { status: 'not ready', timestamp: new Date().toISOString() };
    }
  });
}
