import { z } from 'zod';

export const SEARCH_ENTITY_TYPES = ['customer', 'lead', 'deal', 'task', 'ticket'] as const;
export type SearchEntityType = (typeof SEARCH_ENTITY_TYPES)[number];

export const searchQuerySchema = z.object({
  q: z.string().trim().min(1, 'Search query is required'),
  limit: z.coerce.number().int().min(1).max(20).default(8),
});
export type SearchQuery = z.infer<typeof searchQuerySchema>;

export const searchResultSchema = z.object({
  entityType: z.enum(SEARCH_ENTITY_TYPES),
  entityId: z.string().uuid(),
  title: z.string(),
  subtitle: z.string(),
  rank: z.number(),
});
export type SearchResult = z.infer<typeof searchResultSchema>;
