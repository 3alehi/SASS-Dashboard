import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { computeChangePercent, resolveDateRange } from '@/modules/dashboard/date-range.js';

describe('resolveDateRange', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2024-06-15T12:00:00Z'));
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('resolves a 7d preset to a window starting 7 days ago and ending today (8 inclusive days)', () => {
    const range = resolveDateRange({ preset: '7d', compare: false });
    const days = Math.round((range.to.getTime() - range.from.getTime()) / (1000 * 60 * 60 * 24));
    expect(days).toBe(8);
  });

  it('resolves a 30d preset to a window starting 30 days ago and ending today (31 inclusive days)', () => {
    const range = resolveDateRange({ preset: '30d', compare: false });
    const days = Math.round((range.to.getTime() - range.from.getTime()) / (1000 * 60 * 60 * 24));
    expect(days).toBe(31);
  });

  it('resolves this_year to January 1st of the current year', () => {
    const range = resolveDateRange({ preset: 'this_year', compare: false });
    expect(range.from.getFullYear()).toBe(2024);
    expect(range.from.getMonth()).toBe(0);
    expect(range.from.getDate()).toBe(1);
  });

  it('computes a previous period of equal length immediately preceding the current one', () => {
    const range = resolveDateRange({ preset: '30d', compare: false });
    const currentDurationMs = range.to.getTime() - range.from.getTime();
    const previousDurationMs = range.previousTo.getTime() - range.previousFrom.getTime();

    // Equal length (within a day's slack from the 1ms boundary adjustment).
    expect(Math.abs(currentDurationMs - previousDurationMs)).toBeLessThan(1000 * 60 * 60 * 24);
    // The previous period ends right before the current one starts.
    expect(range.previousTo.getTime()).toBeLessThan(range.from.getTime());
  });

  it('respects explicit from/to for a custom range', () => {
    const range = resolveDateRange({
      preset: 'custom',
      from: '2024-01-01',
      to: '2024-01-10',
      compare: false,
    });
    expect(range.from.toISOString().slice(0, 10)).toBe('2024-01-01');
    expect(range.to.toISOString().slice(0, 10)).toBe('2024-01-10');
  });
});

describe('computeChangePercent', () => {
  it('returns null when there is no previous value', () => {
    expect(computeChangePercent(100, null)).toBeNull();
  });

  it('returns null when the previous value is zero (division by zero)', () => {
    expect(computeChangePercent(100, 0)).toBeNull();
  });

  it('computes a positive percent increase', () => {
    expect(computeChangePercent(150, 100)).toBe(50);
  });

  it('computes a negative percent decrease', () => {
    expect(computeChangePercent(50, 100)).toBe(-50);
  });
});
