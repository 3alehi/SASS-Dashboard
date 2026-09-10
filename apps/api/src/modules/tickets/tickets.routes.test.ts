import type { FastifyInstance } from 'fastify';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';

import { buildApp } from '@/app.js';

describe('tickets routes', () => {
  let app: FastifyInstance;
  const orgId = '00000000-0000-0000-0000-000000000001';
  const ticketId = '00000000-0000-0000-0000-000000000002';

  beforeAll(async () => {
    app = await buildApp();
    await app.ready();
  });

  afterAll(async () => {
    await app.close();
  });

  it('GET .../tickets requires authentication', async () => {
    const response = await app.inject({
      method: 'GET',
      url: `/api/v1/organizations/${orgId}/tickets`,
    });
    expect(response.statusCode).toBe(401);
  });

  it('GET .../tickets/:ticketId requires authentication', async () => {
    const response = await app.inject({
      method: 'GET',
      url: `/api/v1/organizations/${orgId}/tickets/${ticketId}`,
    });
    expect(response.statusCode).toBe(401);
  });

  it('POST .../tickets requires authentication', async () => {
    const response = await app.inject({
      method: 'POST',
      url: `/api/v1/organizations/${orgId}/tickets`,
      payload: { title: 'Cannot log in' },
    });
    expect(response.statusCode).toBe(401);
  });

  it('PATCH .../tickets/:ticketId requires authentication', async () => {
    const response = await app.inject({
      method: 'PATCH',
      url: `/api/v1/organizations/${orgId}/tickets/${ticketId}`,
      payload: { status: 'RESOLVED' },
    });
    expect(response.statusCode).toBe(401);
  });

  it('DELETE .../tickets/:ticketId requires authentication', async () => {
    const response = await app.inject({
      method: 'DELETE',
      url: `/api/v1/organizations/${orgId}/tickets/${ticketId}`,
    });
    expect(response.statusCode).toBe(401);
  });

  it('GET .../tickets/:ticketId/messages requires authentication', async () => {
    const response = await app.inject({
      method: 'GET',
      url: `/api/v1/organizations/${orgId}/tickets/${ticketId}/messages`,
    });
    expect(response.statusCode).toBe(401);
  });

  it('POST .../tickets/:ticketId/messages requires authentication', async () => {
    const response = await app.inject({
      method: 'POST',
      url: `/api/v1/organizations/${orgId}/tickets/${ticketId}/messages`,
      payload: { body: 'We are looking into this.' },
    });
    expect(response.statusCode).toBe(401);
  });

  it('POST .../tickets/:ticketId/messages with an internal note also requires authentication', async () => {
    const response = await app.inject({
      method: 'POST',
      url: `/api/v1/organizations/${orgId}/tickets/${ticketId}/messages`,
      payload: { body: 'Escalating internally.', isInternal: true },
    });
    expect(response.statusCode).toBe(401);
  });
});
