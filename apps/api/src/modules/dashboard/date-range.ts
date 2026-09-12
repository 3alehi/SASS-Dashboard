import type { DashboardQuery } from '@nexora/shared';

export interface ResolvedDateRange {
  from: Date;
  to: Date;
  previousFrom: Date;
  previousTo: Date;
}

/**
 * Resolves a dashboard query's preset (or explicit from/to for 'custom')
 * into a concrete [from, to] range plus the immediately preceding period of
 * equal length, used for period-over-period comparison. 'to' is always the
 * end of the current day so a same-day range is non-empty.
 */
export function resolveDateRange(query: DashboardQuery): ResolvedDateRange {
  const to = new Date();
  to.setHours(23, 59, 59, 999);

  let from: Date;

  switch (query.preset) {
    case '7d':
      from = daysAgo(to, 7);
      break;
    case '90d':
      from = daysAgo(to, 90);
      break;
    case 'this_year':
      from = new Date(to.getFullYear(), 0, 1);
      break;
    case 'custom': {
      const parsedFrom = query.from ? new Date(query.from) : daysAgo(to, 30);
      const parsedTo = query.to ? new Date(query.to) : to;
      parsedTo.setHours(23, 59, 59, 999);
      const durationMs = parsedTo.getTime() - parsedFrom.getTime();
      return {
        from: parsedFrom,
        to: parsedTo,
        previousFrom: new Date(parsedFrom.getTime() - durationMs),
        previousTo: new Date(parsedFrom.getTime() - 1),
      };
    }
    case '30d':
    default:
      from = daysAgo(to, 30);
      break;
  }

  const durationMs = to.getTime() - from.getTime();

  return {
    from,
    to,
    previousFrom: new Date(from.getTime() - durationMs),
    previousTo: new Date(from.getTime() - 1),
  };
}

function daysAgo(reference: Date, days: number): Date {
  const date = new Date(reference);
  date.setDate(date.getDate() - days);
  date.setHours(0, 0, 0, 0);
  return date;
}

export function computeChangePercent(current: number, previous: number | null): number | null {
  if (previous === null || previous === 0) return null;
  return ((current - previous) / previous) * 100;
}
