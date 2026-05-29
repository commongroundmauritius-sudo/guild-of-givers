/**
 * Utilities for securing dynamic Supabase queries.
 */

/**
 * Validates a sort field against an allowlist.
 */
export function validateSortField(field: string, allowlist: string[]): string {
  if (allowlist.includes(field)) {
    return field;
  }
  return allowlist[0]; // Fallback to default
}

/**
 * Validates a filter key against an allowlist.
 */
export function validateFilterKey(key: string, allowlist: string[]): boolean {
  return allowlist.includes(key);
}

/**
 * Sanitizes search queries for use in text search filters.
 */
export function sanitizeSearchQuery(query: string): string {
  // Remove special postgres search characters to prevent unexpected behavior
  return query.replace(/[:&|!<>]/g, "").trim();
}
