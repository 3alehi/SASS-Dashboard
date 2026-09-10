import type { FastifyError, FastifyReply, FastifyRequest } from 'fastify';
import fp from 'fastify-plugin';
import { ZodError } from 'zod';

import { env } from '@/config/env.js';

/**
 * Central error handler. Never leaks stack traces or internal error details
 * to the client in production; always responds with the standard
 * { success: false, error: { code, message, details } } envelope.
 */
export default fp(async function errorHandlerPlugin(app) {
  app.setErrorHandler((error: FastifyError, request: FastifyRequest, reply: FastifyReply) => {
    request.log.error({ err: error }, 'Request failed');

    if (error instanceof ZodError) {
      return reply.code(400).send({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Request validation failed.',
          details: error.flatten(),
        },
      });
    }

    if (error.validation) {
      return reply.code(400).send({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Request validation failed.',
          details: error.validation,
        },
      });
    }

    const statusCode = error.statusCode ?? 500;
    const isServerError = statusCode >= 500;

    return reply.code(statusCode).send({
      success: false,
      error: {
        code: isServerError ? 'INTERNAL_SERVER_ERROR' : (error.code ?? 'ERROR'),
        message:
          isServerError && env.NODE_ENV === 'production' ? 'Something went wrong.' : error.message,
      },
    });
  });

  app.setNotFoundHandler((request: FastifyRequest, reply: FastifyReply) => {
    reply.code(404).send({
      success: false,
      error: { code: 'NOT_FOUND', message: `Route ${request.method} ${request.url} not found.` },
    });
  });
});
