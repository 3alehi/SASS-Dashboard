import type { FastifyInstance } from 'fastify';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';

import { buildApp } from '@/app.js';

describe('tasks routes', () => {
  let app: FastifyInstance;
  const orgId = '00000000-0000-0000-0000-000000000001';
  const taskId = '00000000-0000-0000-0000-000000000002';

  beforeAll(async () => {
    app = await buildApp();
    await app.ready();
  });

  afterAll(async () => {
    await app.close();
  });

  it('GET .../tasks requires authentication', async () => {
    const response = await app.inject({
      method: 'GET',
      url: `/api/v1/organizations/${orgId}/tasks`,
    });
    expect(response.statusCode).toBe(401);
  });

  it('GET .../tasks/board requires authentication (and is not captured by the :taskId route)', async () => {
    const response = await app.inject({
      method: 'GET',
      url: `/api/v1/organizations/${orgId}/tasks/board`,
    });
    // This must be 401 (routed to the board handler's auth check), not a 400
    // from trying to parse "board" as a UUID taskId param.
    expect(response.statusCode).toBe(401);
  });

  it('GET .../tasks/:taskId requires authentication', async () => {
    const response = await app.inject({
      method: 'GET',
      url: `/api/v1/organizations/${orgId}/tasks/${taskId}`,
    });
    expect(response.statusCode).toBe(401);
  });

  it('POST .../tasks requires authentication', async () => {
    const response = await app.inject({
      method: 'POST',
      url: `/api/v1/organizations/${orgId}/tasks`,
      payload: { title: 'Follow up' },
    });
    expect(response.statusCode).toBe(401);
  });

  it('PATCH .../tasks/:taskId requires authentication', async () => {
    const response = await app.inject({
      method: 'PATCH',
      url: `/api/v1/organizations/${orgId}/tasks/${taskId}`,
      payload: { status: 'COMPLETED' },
    });
    expect(response.statusCode).toBe(401);
  });

  it('DELETE .../tasks/:taskId requires authentication', async () => {
    const response = await app.inject({
      method: 'DELETE',
      url: `/api/v1/organizations/${orgId}/tasks/${taskId}`,
    });
    expect(response.statusCode).toBe(401);
  });

  it('GET .../tasks/:taskId/comments requires authentication', async () => {
    const response = await app.inject({
      method: 'GET',
      url: `/api/v1/organizations/${orgId}/tasks/${taskId}/comments`,
    });
    expect(response.statusCode).toBe(401);
  });

  it('POST .../tasks/:taskId/comments requires authentication', async () => {
    const response = await app.inject({
      method: 'POST',
      url: `/api/v1/organizations/${orgId}/tasks/${taskId}/comments`,
      payload: { body: 'Called them back.' },
    });
    expect(response.statusCode).toBe(401);
  });
});
