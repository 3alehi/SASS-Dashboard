import cors from '@fastify/cors';
import helmet from '@fastify/helmet';
import rateLimit from '@fastify/rate-limit';
import swagger from '@fastify/swagger';
import swaggerUi from '@fastify/swagger-ui';
import Fastify from 'fastify';
import type { ZodTypeProvider } from 'fastify-type-provider-zod';
import {
  jsonSchemaTransform,
  serializerCompiler,
  validatorCompiler,
} from 'fastify-type-provider-zod';

import { env } from '@/config/env.js';
import { customersRoutes } from '@/modules/customers/customers.routes.js';
import { healthRoutes } from '@/modules/health/health.routes.js';
import { meRoutes } from '@/modules/me/me.routes.js';
import { teamRoutes } from '@/modules/team/team.routes.js';
import authenticatePlugin from '@/plugins/authenticate.js';
import errorHandlerPlugin from '@/plugins/error-handler.js';

export async function buildApp() {
  const app = Fastify({
    logger: {
      level: env.LOG_LEVEL,
      transport: env.NODE_ENV === 'development' ? { target: 'pino-pretty' } : undefined,
      redact: ['req.headers.authorization', 'req.headers.cookie'],
    },
  }).withTypeProvider<ZodTypeProvider>();

  app.setValidatorCompiler(validatorCompiler);
  app.setSerializerCompiler(serializerCompiler);

  await app.register(helmet);
  await app.register(cors, {
    origin: env.API_CORS_ORIGIN.split(',').map((origin) => origin.trim()),
    credentials: true,
  });
  await app.register(rateLimit, {
    max: env.RATE_LIMIT_MAX,
    timeWindow: env.RATE_LIMIT_WINDOW_MS,
  });

  if (env.NODE_ENV !== 'production') {
    await app.register(swagger, {
      openapi: {
        info: { title: 'NEXORA API', version: '0.1.0' },
        servers: [{ url: `http://localhost:${env.API_PORT}` }],
        components: {
          securitySchemes: {
            bearerAuth: { type: 'http', scheme: 'bearer', bearerFormat: 'JWT' },
          },
        },
      },
      transform: jsonSchemaTransform,
    });
    await app.register(swaggerUi, { routePrefix: '/docs' });
  }

  await app.register(errorHandlerPlugin);
  await app.register(authenticatePlugin);

  await app.register(
    async (v1) => {
      await v1.register(healthRoutes);
      await v1.register(meRoutes);
      await v1.register(teamRoutes);
      await v1.register(customersRoutes);
    },
    { prefix: '/api/v1' },
  );

  return app;
}
