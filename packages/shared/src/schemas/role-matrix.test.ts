import { describe, expect, it } from 'vitest';

import { roleMatrixSchema } from './role-matrix.js';

describe('roleMatrixSchema', () => {
  it('accepts a list of role/permissions entries', () => {
    const result = roleMatrixSchema.safeParse([
      { role: 'OWNER', permissions: ['customers.read', 'settings.manage'] },
      { role: 'MEMBER', permissions: [] },
    ]);
    expect(result.success).toBe(true);
  });

  it('rejects an unknown role', () => {
    const result = roleMatrixSchema.safeParse([{ role: 'SUPERADMIN', permissions: [] }]);
    expect(result.success).toBe(false);
  });

  it('rejects an unknown permission key', () => {
    const result = roleMatrixSchema.safeParse([{ role: 'OWNER', permissions: ['not.real'] }]);
    expect(result.success).toBe(false);
  });
});
