import type { FastifyInstance } from 'fastify';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';

import { buildApp } from '@/app.js';

describe('notifications routes', () => {
  let app: FastifyInstance;
  const orgId = '00000000-0000-0000-0000-000000000001';
  const notificationId = '00000000-0000-0000-0000-000000000002';

  beforeAll(async () => {
    app = await buildApp();
    await app.ready();
  });

  afterAll(async () => {
    await app.close();
  });

  it('GET .../notifications requires authentication', async () => {
    const response = await app.inject({
      method: 'GET',
      url: `/api/v1/organizations/${orgId}/notifications`,
    });
    expect(response.statusCode).toBe(401);
  });

  it('GET .../notifications/unread-count requires authentication', async () => {
    const response = await app.inject({
      method: 'GET',
      url: `/api/v1/organizations/${orgId}/notifications/unread-count`,
    });
    expect(response.statusCode).toBe(401);
  });

  it('POST .../notifications/read-all requires authentication', async () => {
    const response = await app.inject({
      method: 'POST',
      url: `/api/v1/organizations/${orgId}/notifications/read-all`,
    });
    expect(response.statusCode).toBe(401);
  });

  it('POST .../notifications/:notificationId/read requires authentication', async () => {
    const response = await app.inject({
      method: 'POST',
      url: `/api/v1/organizations/${orgId}/notifications/${notificationId}/read`,
    });
    expect(response.statusCode).toBe(401);
  });
});
