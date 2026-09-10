import type { FastifyInstance } from 'fastify';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';

import { buildApp } from '@/app.js';

describe('customers routes', () => {
  let app: FastifyInstance;
  const orgId = '00000000-0000-0000-0000-000000000001';
  const customerId = '00000000-0000-0000-0000-000000000002';

  beforeAll(async () => {
    app = await buildApp();
    await app.ready();
  });

  afterAll(async () => {
    await app.close();
  });

  it('GET .../customers requires authentication', async () => {
    const response = await app.inject({
      method: 'GET',
      url: `/api/v1/organizations/${orgId}/customers`,
    });
    expect(response.statusCode).toBe(401);
  });

  it('GET .../customers/:id requires authentication', async () => {
    const response = await app.inject({
      method: 'GET',
      url: `/api/v1/organizations/${orgId}/customers/${customerId}`,
    });
    expect(response.statusCode).toBe(401);
  });

  it('POST .../customers requires authentication', async () => {
    const response = await app.inject({
      method: 'POST',
      url: `/api/v1/organizations/${orgId}/customers`,
      payload: { name: 'Acme Inc' },
    });
    expect(response.statusCode).toBe(401);
  });

  it('PATCH .../customers/:id requires authentication', async () => {
    const response = await app.inject({
      method: 'PATCH',
      url: `/api/v1/organizations/${orgId}/customers/${customerId}`,
      payload: { name: 'Updated name' },
    });
    expect(response.statusCode).toBe(401);
  });

  it('DELETE .../customers/:id requires authentication', async () => {
    const response = await app.inject({
      method: 'DELETE',
      url: `/api/v1/organizations/${orgId}/customers/${customerId}`,
    });
    expect(response.statusCode).toBe(401);
  });

  it('POST .../customers/:id/restore requires authentication', async () => {
    const response = await app.inject({
      method: 'POST',
      url: `/api/v1/organizations/${orgId}/customers/${customerId}/restore`,
    });
    expect(response.statusCode).toBe(401);
  });

  it('rejects an invalid organizationId path param before hitting auth logic', async () => {
    const response = await app.inject({
      method: 'GET',
      url: `/api/v1/organizations/not-a-uuid/customers`,
    });
    // Fastify validates params before preHandlers run, so this is a 400, not 401.
    expect(response.statusCode).toBe(400);
  });
});
