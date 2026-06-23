import type { FastifyRequest, FastifyReply } from 'fastify';
import { verifyAccessToken } from '../lib/jwt.js';
import { Unauthorized } from '../lib/errors.js';

declare module 'fastify' {
  interface FastifyRequest {
    userId?: string;
  }
}

/** Fastify preHandler: requires a valid Bearer access token. */
export async function requireAuth(req: FastifyRequest, _reply: FastifyReply): Promise<void> {
  const header = req.headers.authorization;
  if (!header || !header.startsWith('Bearer ')) {
    throw Unauthorized('Missing bearer token');
  }
  const token = header.slice('Bearer '.length);
  try {
    const claims = verifyAccessToken(token);
    req.userId = claims.sub;
  } catch {
    throw Unauthorized('Invalid or expired token');
  }
}
