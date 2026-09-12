import type { FastifyInstance } from 'fastify';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';

import { buildApp } from '@/app.js';

describe('app', () => {
  let app: FastifyInstance;

  beforeAll(async () => {
    app = await buildApp();
    await app.ready();
  });

  afterAll(async () => {
    await app.close();
  });

  it('GET /api/v1/health responds 200 without authentication', async () => {
    const response = await app.inject({ method: 'GET', url: '/api/v1/health' });
    expect(response.statusCode).toBe(200);
    const body = response.json();
    expect(body.success).toBe(true);
    expect(body.data.status).toBe('ok');
  });

  it('GET /api/v1/me returns 401 without an Authorization header', async () => {
    const response = await app.inject({ method: 'GET', url: '/api/v1/me' });
    expect(response.statusCode).toBe(401);
    const body = response.json();
    expect(body.success).toBe(false);
    expect(body.error.code).toBe('UNAUTHORIZED');
  });

  it('GET /api/v1/me returns 401 for a malformed Authorization header', async () => {
    const response = await app.inject({
      method: 'GET',
      url: '/api/v1/me',
      headers: { authorization: 'NotBearer abc123' },
    });
    expect(response.statusCode).toBe(401);
  });

  it('GET /api/v1/me returns 401 for an invalid bearer token', async () => {
    const response = await app.inject({
      method: 'GET',
      url: '/api/v1/me',
      headers: { authorization: 'Bearer invalid-token' },
    });
    expect(response.statusCode).toBe(401);
  });

  it('GET /api/v1/me/notification-preferences returns 401 without authentication', async () => {
    const response = await app.inject({
      method: 'GET',
      url: '/api/v1/me/notification-preferences',
    });
    expect(response.statusCode).toBe(401);
  });

  it('PATCH /api/v1/me/notification-preferences returns 401 without authentication', async () => {
    const response = await app.inject({
      method: 'PATCH',
      url: '/api/v1/me/notification-preferences',
      payload: { taskAssigned: false },
    });
    expect(response.statusCode).toBe(401);
  });

  it('GET /api/v1/organizations/:organizationId/team returns 401 without authentication', async () => {
    const response = await app.inject({
      method: 'GET',
      url: '/api/v1/organizations/00000000-0000-0000-0000-000000000000/team',
    });
    expect(response.statusCode).toBe(401);
  });

  it('unknown routes return a structured 404', async () => {
    const response = await app.inject({ method: 'GET', url: '/api/v1/does-not-exist' });
    expect(response.statusCode).toBe(404);
    const body = response.json();
    expect(body.success).toBe(false);
    expect(body.error.code).toBe('NOT_FOUND');
  });
});
