import { isUUID } from "../identifiers";

/**
 * Validates if a redirect URL is safe (internal to the application).
 * Prevents Open Redirect vulnerabilities.
 */
export function isValidRedirect(url: string): boolean {
  if (!url) return false;

  // Allow relative paths starting with /
  if (url.startsWith("/") && !url.startsWith("//")) {
    return true;
  }

  // Allow current origin
  if (typeof window !== "undefined") {
    try {
      const parsedUrl = new URL(url);
      return parsedUrl.origin === window.location.origin;
    } catch {
      return false;
    }
  }

  return false;
}

/**
 * Safely parses a UUID, returning null if invalid.
 */
export function safeParseUUID(id: string | null | undefined): string | null {
  if (!id) return null;
  return isUUID(id) ? id : null;
}
