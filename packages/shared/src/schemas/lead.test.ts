import { describe, expect, it } from 'vitest';

import {
  convertLeadSchema,
  createLeadSchema,
  leadListQuerySchema,
  updateLeadSchema,
} from './lead.js';

describe('createLeadSchema', () => {
  it('accepts a minimal valid payload', () => {
    const result = createLeadSchema.safeParse({ fullName: 'Jane Doe' });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.status).toBe('NEW');
    }
  });

  it('rejects an empty fullName', () => {
    const result = createLeadSchema.safeParse({ fullName: '' });
    expect(result.success).toBe(false);
  });

  it('rejects an invalid email', () => {
    const result = createLeadSchema.safeParse({ fullName: 'Jane', email: 'not-an-email' });
    expect(result.success).toBe(false);
  });

  it('rejects an invalid status', () => {
    const result = createLeadSchema.safeParse({ fullName: 'Jane', status: 'BOGUS' });
    expect(result.success).toBe(false);
  });

  it('coerces a numeric string value', () => {
    const result = createLeadSchema.safeParse({ fullName: 'Jane', value: '2500' });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.value).toBe(2500);
    }
  });
});

describe('updateLeadSchema', () => {
  it('accepts a partial payload', () => {
    const result = updateLeadSchema.safeParse({ status: 'QUALIFIED' });
    expect(result.success).toBe(true);
  });
});

describe('leadListQuerySchema', () => {
  it('applies defaults', () => {
    const result = leadListQuerySchema.safeParse({});
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.page).toBe(1);
      expect(result.data.sortBy).toBe('createdAt');
    }
  });

  it('rejects an invalid status filter', () => {
    const result = leadListQuerySchema.safeParse({ status: 'NOT_A_STATUS' });
    expect(result.success).toBe(false);
  });
});

describe('convertLeadSchema', () => {
  it('defaults createDeal to false', () => {
    const result = convertLeadSchema.safeParse({});
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.createDeal).toBe(false);
    }
  });

  it('accepts a deal creation payload', () => {
    const result = convertLeadSchema.safeParse({
      createDeal: true,
      pipelineId: '11111111-1111-1111-1111-111111111111',
      stageId: '22222222-2222-2222-2222-222222222222',
      dealValue: 5000,
    });
    expect(result.success).toBe(true);
  });
});
