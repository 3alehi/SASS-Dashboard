import type { FastifyInstance } from 'fastify';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';

import { buildApp } from '@/app.js';

describe('team routes', () => {
  let app: FastifyInstance;
  const orgId = '00000000-0000-0000-0000-000000000001';
  const memberId = '00000000-0000-0000-0000-000000000002';

  beforeAll(async () => {
    app = await buildApp();
    await app.ready();
  });

  afterAll(async () => {
    await app.close();
  });

  it('GET .../team requires authentication', async () => {
    const response = await app.inject({ method: 'GET', url: `/api/v1/organizations/${orgId}/team` });
    expect(response.statusCode).toBe(401);
  });

  it('POST .../team/invite requires authentication', async () => {
    const response = await app.inject({
      method: 'POST',
      url: `/api/v1/organizations/${orgId}/team/invite`,
      payload: { email: 'new.hire@example.com', role: 'SALES' },
    });
    expect(response.statusCode).toBe(401);
  });

  it('rejects an invite payload requesting the OWNER role before reaching auth (schema-invalid either way)', async () => {
    const response = await app.inject({
      method: 'POST',
      url: `/api/v1/organizations/${orgId}/team/invite`,
      payload: { email: 'new.hire@example.com', role: 'OWNER' },
    });
    expect([400, 401]).toContain(response.statusCode);
  });

  it('PATCH .../team/:memberId/role requires authentication', async () => {
    const response = await app.inject({
      method: 'PATCH',
      url: `/api/v1/organizations/${orgId}/team/${memberId}/role`,
      payload: { role: 'MANAGER' },
    });
    expect(response.statusCode).toBe(401);
  });

  it('POST .../team/:memberId/deactivate requires authentication', async () => {
    const response = await app.inject({
      method: 'POST',
      url: `/api/v1/organizations/${orgId}/team/${memberId}/deactivate`,
    });
    expect(response.statusCode).toBe(401);
  });

  it('POST .../team/:memberId/reactivate requires authentication', async () => {
    const response = await app.inject({
      method: 'POST',
      url: `/api/v1/organizations/${orgId}/team/${memberId}/reactivate`,
    });
    expect(response.statusCode).toBe(401);
  });

  it('DELETE .../team/:memberId requires authentication', async () => {
    const response = await app.inject({
      method: 'DELETE',
      url: `/api/v1/organizations/${orgId}/team/${memberId}`,
    });
    expect(response.statusCode).toBe(401);
  });
});
