import type { FastifyReply, FastifyRequest } from 'fastify';
import fp from 'fastify-plugin';

import { supabaseAdmin } from '@/lib/supabase-admin.js';

export interface AuthenticatedUser {
  id: string;
  email: string | undefined;
}

declare module 'fastify' {
  interface FastifyRequest {
    user: AuthenticatedUser;
  }
}

/**
 * Verifies the Supabase-issued JWT on every request via authenticate.ts's
 * onRequest hook and attaches the resulting user to request.user. Routes opt
 * in by calling `app.authenticate` as a preHandler — this plugin only
 * registers the decorator, it does not enforce auth globally, so public
 * routes (health check, docs) are unaffected.
 */
export default fp(async function authenticatePlugin(app) {
  app.decorate('authenticate', async (request: FastifyRequest, reply: FastifyReply) => {
    const authHeader = request.headers.authorization;

    if (!authHeader?.startsWith('Bearer ')) {
      return reply.code(401).send({
        success: false,
        error: { code: 'UNAUTHORIZED', message: 'Missing or malformed Authorization header.' },
      });
    }

    const token = authHeader.slice('Bearer '.length);
    const { data, error } = await supabaseAdmin.auth.getUser(token);

    if (error || !data.user) {
      return reply.code(401).send({
        success: false,
        error: { code: 'UNAUTHORIZED', message: 'Invalid or expired session.' },
      });
    }

    request.user = { id: data.user.id, email: data.user.email };
  });
});

declare module 'fastify' {
  interface FastifyInstance {
    authenticate: (request: FastifyRequest, reply: FastifyReply) => Promise<void>;
  }
}
