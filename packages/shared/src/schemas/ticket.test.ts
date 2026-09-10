import { describe, expect, it } from 'vitest';

import {
  createTicketMessageSchema,
  createTicketSchema,
  ticketListQuerySchema,
  updateTicketSchema,
} from './ticket.js';

describe('createTicketSchema', () => {
  it('accepts a minimal valid payload', () => {
    const result = createTicketSchema.safeParse({ title: 'Cannot log in' });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.status).toBe('OPEN');
      expect(result.data.priority).toBe('MEDIUM');
    }
  });

  it('rejects an empty title', () => {
    const result = createTicketSchema.safeParse({ title: '' });
    expect(result.success).toBe(false);
  });

  it('rejects an invalid priority', () => {
    const result = createTicketSchema.safeParse({ title: 'Issue', priority: 'CRITICAL' });
    expect(result.success).toBe(false);
  });

  it('rejects an invalid status', () => {
    const result = createTicketSchema.safeParse({ title: 'Issue', status: 'ARCHIVED' });
    expect(result.success).toBe(false);
  });
});

describe('updateTicketSchema', () => {
  it('accepts a partial payload', () => {
    const result = updateTicketSchema.safeParse({ status: 'RESOLVED' });
    expect(result.success).toBe(true);
  });
});

describe('ticketListQuerySchema', () => {
  it('applies defaults', () => {
    const result = ticketListQuerySchema.safeParse({});
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.sortBy).toBe('createdAt');
      expect(result.data.sortDir).toBe('desc');
    }
  });

  it('rejects an invalid status filter', () => {
    const result = ticketListQuerySchema.safeParse({ status: 'ARCHIVED' });
    expect(result.success).toBe(false);
  });
});

describe('createTicketMessageSchema', () => {
  it('defaults isInternal to false', () => {
    const result = createTicketMessageSchema.safeParse({ body: 'We are looking into this.' });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.isInternal).toBe(false);
    }
  });

  it('rejects an empty body', () => {
    const result = createTicketMessageSchema.safeParse({ body: '' });
    expect(result.success).toBe(false);
  });

  it('accepts an internal note', () => {
    const result = createTicketMessageSchema.safeParse({
      body: 'Escalating to engineering.',
      isInternal: true,
    });
    expect(result.success).toBe(true);
  });
});
