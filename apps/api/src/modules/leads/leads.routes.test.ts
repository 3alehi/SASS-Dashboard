import type { FastifyInstance } from 'fastify';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';

import { buildApp } from '@/app.js';

describe('leads routes', () => {
  let app: FastifyInstance;
  const orgId = '00000000-0000-0000-0000-000000000001';
  const leadId = '00000000-0000-0000-0000-000000000002';

  beforeAll(async () => {
    app = await buildApp();
    await app.ready();
  });

  afterAll(async () => {
    await app.close();
  });

  it('GET .../leads requires authentication', async () => {
    const response = await app.inject({
      method: 'GET',
      url: `/api/v1/organizations/${orgId}/leads`,
    });
    expect(response.statusCode).toBe(401);
  });

  it('GET .../leads/:id requires authentication', async () => {
    const response = await app.inject({
      method: 'GET',
      url: `/api/v1/organizations/${orgId}/leads/${leadId}`,
    });
    expect(response.statusCode).toBe(401);
  });

  it('POST .../leads requires authentication', async () => {
    const response = await app.inject({
      method: 'POST',
      url: `/api/v1/organizations/${orgId}/leads`,
      payload: { fullName: 'Jane Doe' },
    });
    expect(response.statusCode).toBe(401);
  });

  it('PATCH .../leads/:id requires authentication', async () => {
    const response = await app.inject({
      method: 'PATCH',
      url: `/api/v1/organizations/${orgId}/leads/${leadId}`,
      payload: { status: 'QUALIFIED' },
    });
    expect(response.statusCode).toBe(401);
  });

  it('DELETE .../leads/:id requires authentication', async () => {
    const response = await app.inject({
      method: 'DELETE',
      url: `/api/v1/organizations/${orgId}/leads/${leadId}`,
    });
    expect(response.statusCode).toBe(401);
  });

  it('POST .../leads/:id/convert requires authentication', async () => {
    const response = await app.inject({
      method: 'POST',
      url: `/api/v1/organizations/${orgId}/leads/${leadId}/convert`,
      payload: {},
    });
    expect(response.statusCode).toBe(401);
  });

  it('rejects an invalid body on create before hitting auth (schema validated first is fine either way, but must not 500)', async () => {
    const response = await app.inject({
      method: 'POST',
      url: `/api/v1/organizations/${orgId}/leads`,
      payload: { fullName: '' },
    });
    expect([400, 401]).toContain(response.statusCode);
  });
});
