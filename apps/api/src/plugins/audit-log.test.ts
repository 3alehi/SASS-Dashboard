import Fastify from 'fastify';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import * as auditRepository from '@/modules/audit/audit.repository.js';
import auditLogPlugin from '@/plugins/audit-log.js';

function buildTestApp() {
  const app = Fastify();

  app.addHook('onRequest', async (request) => {
    request.user = { id: 'user-1', email: 'user@example.com' };
  });

  app.register(auditLogPlugin);

  app.post(
    '/organizations/:organizationId/widgets',
    { config: { audit: { action: 'widget.create', entityType: 'widget' } } },
    async (_request, reply) => {
      return reply.code(201).send({ success: true, data: { id: 'widget-1', name: 'New widget' } });
    },
  );

  app.patch(
    '/organizations/:organizationId/widgets/:widgetId',
    { config: { audit: { action: 'widget.update', entityType: 'widget' } } },
    async () => ({ success: true, data: { id: 'widget-1', name: 'Renamed' } }),
  );

  app.delete(
    '/organizations/:organizationId/widgets/:widgetId',
    { config: { audit: { action: 'widget.delete', entityType: 'widget' } } },
    async () => ({ success: true, data: { ok: true } }),
  );

  app.post(
    '/organizations/:organizationId/widgets/:widgetId/fail',
    { config: { audit: { action: 'widget.fail', entityType: 'widget' } } },
    async (_request, reply) => reply.code(400).send({ success: false, error: { code: 'BAD' } }),
  );

  app.get('/organizations/:organizationId/widgets', async () => ({ success: true, data: [] }));

  return app;
}

describe('auditLogPlugin', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it('logs a create with the entity id read back from the response body', async () => {
    const writeSpy = vi.spyOn(auditRepository, 'writeAuditLog').mockResolvedValue(undefined);
    const app = buildTestApp();

    await app.inject({ method: 'POST', url: '/organizations/org-1/widgets', payload: {} });

    expect(writeSpy).toHaveBeenCalledWith(
      expect.objectContaining({
        organizationId: 'org-1',
        actorId: 'user-1',
        action: 'widget.create',
        entityType: 'widget',
        entityId: 'widget-1',
      }),
    );
  });

  it('logs an update/delete with the entity id read from route params', async () => {
    const writeSpy = vi.spyOn(auditRepository, 'writeAuditLog').mockResolvedValue(undefined);
    const app = buildTestApp();

    await app.inject({
      method: 'PATCH',
      url: '/organizations/org-1/widgets/widget-42',
      payload: {},
    });

    expect(writeSpy).toHaveBeenCalledWith(
      expect.objectContaining({ action: 'widget.update', entityId: 'widget-42' }),
    );
  });

  it('does not log a route with no audit config', async () => {
    const writeSpy = vi.spyOn(auditRepository, 'writeAuditLog').mockResolvedValue(undefined);
    const app = buildTestApp();

    await app.inject({ method: 'GET', url: '/organizations/org-1/widgets' });

    expect(writeSpy).not.toHaveBeenCalled();
  });

  it('does not log a failed (non-2xx) response even on an audited route', async () => {
    const writeSpy = vi.spyOn(auditRepository, 'writeAuditLog').mockResolvedValue(undefined);
    const app = buildTestApp();

    await app.inject({
      method: 'POST',
      url: '/organizations/org-1/widgets/widget-1/fail',
      payload: {},
    });

    expect(writeSpy).not.toHaveBeenCalled();
  });
});
