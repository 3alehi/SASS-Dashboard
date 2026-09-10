import { describe, expect, it } from 'vitest';

import { inviteMemberSchema, updateMemberRoleSchema } from './team.js';

describe('inviteMemberSchema', () => {
  it('accepts a valid email and defaults role to MEMBER', () => {
    const result = inviteMemberSchema.safeParse({ email: 'new.hire@example.com' });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.role).toBe('MEMBER');
    }
  });

  it('lowercases and trims the email', () => {
    const result = inviteMemberSchema.safeParse({ email: '  Person@Example.com  ' });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.email).toBe('person@example.com');
    }
  });

  it('rejects an invalid email', () => {
    const result = inviteMemberSchema.safeParse({ email: 'not-an-email' });
    expect(result.success).toBe(false);
  });

  it('rejects OWNER as an invite role', () => {
    const result = inviteMemberSchema.safeParse({ email: 'person@example.com', role: 'OWNER' });
    expect(result.success).toBe(false);
  });

  it('accepts a valid non-owner role', () => {
    const result = inviteMemberSchema.safeParse({ email: 'person@example.com', role: 'SALES' });
    expect(result.success).toBe(true);
  });
});

describe('updateMemberRoleSchema', () => {
  it('rejects OWNER as a role change target', () => {
    const result = updateMemberRoleSchema.safeParse({ role: 'OWNER' });
    expect(result.success).toBe(false);
  });

  it('accepts a valid non-owner role', () => {
    const result = updateMemberRoleSchema.safeParse({ role: 'MANAGER' });
    expect(result.success).toBe(true);
  });
});
