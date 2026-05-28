/**
 * Utility to check if a string is a valid UUID.
 * Useful for branching logic in Supabase queries to avoid 400 Bad Request
 * when comparing UUID columns against non-UUID strings.
 */
export const isUUID = (identifier: string): boolean => {
  return /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/.test(identifier);
};
