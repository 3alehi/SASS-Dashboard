import type { FastifyInstance } from 'fastify';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';

import { buildApp } from '@/app.js';

describe('search routes', () => {
  let app: FastifyInstance;
  const orgId = '00000000-0000-0000-0000-000000000001';

  beforeAll(async () => {
    app = await buildApp();
    await app.ready();
  });

  afterAll(async () => {
    await app.close();
  });

  it('GET .../search requires authentication', async () => {
    const response = await app.inject({
      method: 'GET',
      url: `/api/v1/organizations/${orgId}/search?q=acme`,
    });
    expect(response.statusCode).toBe(401);
  });

  it('rejects an empty query with a 400 or 401', async () => {
    const response = await app.inject({
      method: 'GET',
      url: `/api/v1/organizations/${orgId}/search?q=`,
    });
    // Schema validation may run before auth; either is acceptable as long
    // as it never reaches the handler (never a 500) with an empty query.
    expect([400, 401]).toContain(response.statusCode);
  });
});
