import type { FastifyInstance } from 'fastify';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';

import { buildApp } from '@/app.js';

describe('deals and pipelines routes', () => {
  let app: FastifyInstance;
  const orgId = '00000000-0000-0000-0000-000000000001';
  const dealId = '00000000-0000-0000-0000-000000000002';
  const pipelineId = '00000000-0000-0000-0000-000000000003';

  beforeAll(async () => {
    app = await buildApp();
    await app.ready();
  });

  afterAll(async () => {
    await app.close();
  });

  it('GET .../pipelines requires authentication', async () => {
    const response = await app.inject({
      method: 'GET',
      url: `/api/v1/organizations/${orgId}/pipelines`,
    });
    expect(response.statusCode).toBe(401);
  });

  it('GET .../pipelines/:id/deals requires authentication', async () => {
    const response = await app.inject({
      method: 'GET',
      url: `/api/v1/organizations/${orgId}/pipelines/${pipelineId}/deals`,
    });
    expect(response.statusCode).toBe(401);
  });

  it('GET .../pipelines/:id/summary requires authentication', async () => {
    const response = await app.inject({
      method: 'GET',
      url: `/api/v1/organizations/${orgId}/pipelines/${pipelineId}/summary`,
    });
    expect(response.statusCode).toBe(401);
  });

  it('GET .../deals requires authentication', async () => {
    const response = await app.inject({
      method: 'GET',
      url: `/api/v1/organizations/${orgId}/deals`,
    });
    expect(response.statusCode).toBe(401);
  });

  it('GET .../deals/:id requires authentication', async () => {
    const response = await app.inject({
      method: 'GET',
      url: `/api/v1/organizations/${orgId}/deals/${dealId}`,
    });
    expect(response.statusCode).toBe(401);
  });

  it('POST .../deals requires authentication', async () => {
    const response = await app.inject({
      method: 'POST',
      url: `/api/v1/organizations/${orgId}/deals`,
      payload: { title: 'Deal', pipelineId, stageId: dealId },
    });
    expect(response.statusCode).toBe(401);
  });

  it('PATCH .../deals/:id requires authentication', async () => {
    const response = await app.inject({
      method: 'PATCH',
      url: `/api/v1/organizations/${orgId}/deals/${dealId}`,
      payload: { value: 1000 },
    });
    expect(response.statusCode).toBe(401);
  });

  it('POST .../deals/:id/move requires authentication', async () => {
    const response = await app.inject({
      method: 'POST',
      url: `/api/v1/organizations/${orgId}/deals/${dealId}/move`,
      payload: { stageId: pipelineId },
    });
    expect(response.statusCode).toBe(401);
  });

  it('DELETE .../deals/:id requires authentication', async () => {
    const response = await app.inject({
      method: 'DELETE',
      url: `/api/v1/organizations/${orgId}/deals/${dealId}`,
    });
    expect(response.statusCode).toBe(401);
  });

  it('rejects a move payload with an invalid stageId shape', async () => {
    const response = await app.inject({
      method: 'POST',
      url: `/api/v1/organizations/${orgId}/deals/${dealId}/move`,
      payload: { stageId: 'not-a-uuid' },
    });
    // Schema validation runs before auth for the body, but either a 400 or
    // 401 is acceptable here — the important thing is it never reaches the
    // handler (never a 500) with a malformed id.
    expect([400, 401]).toContain(response.statusCode);
  });
});
