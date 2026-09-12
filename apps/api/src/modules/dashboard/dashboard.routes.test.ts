import type { FastifyInstance } from 'fastify';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';

import { buildApp } from '@/app.js';

describe('dashboard routes', () => {
  let app: FastifyInstance;
  const orgId = '00000000-0000-0000-0000-000000000001';

  beforeAll(async () => {
    app = await buildApp();
    await app.ready();
  });

  afterAll(async () => {
    await app.close();
  });

  it('GET .../dashboard/overview requires authentication', async () => {
    const response = await app.inject({
      method: 'GET',
      url: `/api/v1/organizations/${orgId}/dashboard/overview`,
    });
    expect(response.statusCode).toBe(401);
  });

  it('GET .../dashboard/revenue requires authentication', async () => {
    const response = await app.inject({
      method: 'GET',
      url: `/api/v1/organizations/${orgId}/dashboard/revenue`,
    });
    expect(response.statusCode).toBe(401);
  });

  it('GET .../dashboard/pipeline-by-stage requires authentication', async () => {
    const response = await app.inject({
      method: 'GET',
      url: `/api/v1/organizations/${orgId}/dashboard/pipeline-by-stage`,
    });
    expect(response.statusCode).toBe(401);
  });

  it('GET .../dashboard/won-lost requires authentication', async () => {
    const response = await app.inject({
      method: 'GET',
      url: `/api/v1/organizations/${orgId}/dashboard/won-lost`,
    });
    expect(response.statusCode).toBe(401);
  });

  it('GET .../dashboard/lead-conversion requires authentication', async () => {
    const response = await app.inject({
      method: 'GET',
      url: `/api/v1/organizations/${orgId}/dashboard/lead-conversion`,
    });
    expect(response.statusCode).toBe(401);
  });

  it('GET .../dashboard/sales-performance requires authentication', async () => {
    const response = await app.inject({
      method: 'GET',
      url: `/api/v1/organizations/${orgId}/dashboard/sales-performance`,
    });
    expect(response.statusCode).toBe(401);
  });

  it('rejects an invalid preset in the query string with a 400 or 401', async () => {
    const response = await app.inject({
      method: 'GET',
      url: `/api/v1/organizations/${orgId}/dashboard/overview?preset=6mo`,
    });
    // Schema validation may run before auth; either is acceptable as long
    // as it never reaches the handler (never a 500) with a bad preset.
    expect([400, 401]).toContain(response.statusCode);
  });
});
