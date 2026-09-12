import type { FastifyInstance } from 'fastify';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';

import { buildApp } from '@/app.js';

describe('audit-log routes', () => {
  let app: FastifyInstance;
  const orgId = '00000000-0000-0000-0000-000000000001';

  beforeAll(async () => {
    app = await buildApp();
    await app.ready();
  });

  afterAll(async () => {
    await app.close();
  });

  it('GET .../audit-logs requires authentication', async () => {
    const response = await app.inject({
      method: 'GET',
      url: `/api/v1/organizations/${orgId}/audit-logs`,
    });
    expect(response.statusCode).toBe(401);
  });
});
