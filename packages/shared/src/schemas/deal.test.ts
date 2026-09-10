import { describe, expect, it } from 'vitest';

import { createDealSchema, dealListQuerySchema, moveDealSchema, updateDealSchema } from './deal.js';

const validPipelineId = '11111111-1111-1111-1111-111111111111';
const validStageId = '22222222-2222-2222-2222-222222222222';

describe('createDealSchema', () => {
  it('accepts a minimal valid payload', () => {
    const result = createDealSchema.safeParse({
      title: 'Acme renewal',
      pipelineId: validPipelineId,
      stageId: validStageId,
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.value).toBe(0);
    }
  });

  it('rejects an empty title', () => {
    const result = createDealSchema.safeParse({
      title: '',
      pipelineId: validPipelineId,
      stageId: validStageId,
    });
    expect(result.success).toBe(false);
  });

  it('rejects a missing pipelineId', () => {
    const result = createDealSchema.safeParse({ title: 'Deal', stageId: validStageId });
    expect(result.success).toBe(false);
  });

  it('rejects a probability above 100', () => {
    const result = createDealSchema.safeParse({
      title: 'Deal',
      pipelineId: validPipelineId,
      stageId: validStageId,
      probability: 150,
    });
    expect(result.success).toBe(false);
  });

  it('coerces a numeric string value', () => {
    const result = createDealSchema.safeParse({
      title: 'Deal',
      pipelineId: validPipelineId,
      stageId: validStageId,
      value: '15000',
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.value).toBe(15000);
    }
  });
});

describe('updateDealSchema', () => {
  it('accepts a partial payload', () => {
    const result = updateDealSchema.safeParse({ value: 5000 });
    expect(result.success).toBe(true);
  });
});

describe('moveDealSchema', () => {
  it('requires a valid stageId', () => {
    const result = moveDealSchema.safeParse({ stageId: 'not-a-uuid' });
    expect(result.success).toBe(false);
  });

  it('accepts a valid stageId', () => {
    const result = moveDealSchema.safeParse({ stageId: validStageId });
    expect(result.success).toBe(true);
  });
});

describe('dealListQuerySchema', () => {
  it('applies defaults', () => {
    const result = dealListQuerySchema.safeParse({});
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.page).toBe(1);
      expect(result.data.pageSize).toBe(50);
    }
  });
});
