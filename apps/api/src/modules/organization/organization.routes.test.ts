import type { FastifyInstance } from 'fastify';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';

import { buildApp } from '@/app.js';

describe('organization routes', () => {
  let app: FastifyInstance;
  const orgId = '00000000-0000-0000-0000-000000000001';

  beforeAll(async () => {
    app = await buildApp();
    await app.ready();
  });

  afterAll(async () => {
    await app.close();
  });

  it('GET .../organizations/:organizationId requires authentication', async () => {
    const response = await app.inject({ method: 'GET', url: `/api/v1/organizations/${orgId}` });
    expect(response.statusCode).toBe(401);
  });

  it('PATCH .../organizations/:organizationId requires authentication', async () => {
    const response = await app.inject({
      method: 'PATCH',
      url: `/api/v1/organizations/${orgId}`,
      payload: { name: 'New name' },
    });
    expect(response.statusCode).toBe(401);
  });

  it('GET .../organizations/:organizationId/settings requires authentication', async () => {
    const response = await app.inject({
      method: 'GET',
      url: `/api/v1/organizations/${orgId}/settings`,
    });
    expect(response.statusCode).toBe(401);
  });

  it('PATCH .../organizations/:organizationId/settings requires authentication', async () => {
    const response = await app.inject({
      method: 'PATCH',
      url: `/api/v1/organizations/${orgId}/settings`,
      payload: { dateFormat: 'DD/MM/YYYY' },
    });
    expect(response.statusCode).toBe(401);
  });
});
