import type { FastifyRequest, FastifyReply } from 'fastify';

export interface AuthContext {
  applicationId: string;
  tenantId: string;
  ownerId: string;
  apiKey: string;
}

export async function authMiddleware(
  request: FastifyRequest,
  reply: FastifyReply,
): Promise<void> {
  const apiKey = request.headers['x-api-key'] as string | undefined;
  const applicationId = request.headers['x-application-id'] as string | undefined;
  const tenantId = request.headers['x-tenant-id'] as string | undefined;

  if (!apiKey || !applicationId || !tenantId) {
    return reply.status(401).send({
      error: {
        code: 'UNAUTHORIZED',
        message: 'Missing required headers: x-api-key, x-application-id, x-tenant-id',
      },
    });
  }

  const ownerId = (request.headers['x-owner-id'] as string) ?? 'system';

  (request as FastifyRequest & { auth: AuthContext }).auth = {
    applicationId,
    tenantId,
    ownerId,
    apiKey,
  };
}

export async function internalAuthMiddleware(
  request: FastifyRequest,
  reply: FastifyReply,
): Promise<void> {
  const internalKey = request.headers['x-internal-key'] as string | undefined;
  if (!internalKey || internalKey !== process.env['INTERNAL_API_KEY']) {
    return reply.status(403).send({
      error: {
        code: 'FORBIDDEN',
        message: 'Invalid internal API key',
      },
    });
  }
}

export function getAuthContext(request: FastifyRequest): AuthContext {
  const auth = (request as FastifyRequest & { auth?: AuthContext }).auth;
  if (!auth) throw new Error('Auth context not found');
  return auth;
}
