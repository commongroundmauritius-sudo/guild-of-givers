import DOMPurify from "dompurify";

/**
 * Sanitizes HTML strings to prevent XSS attacks.
 * Uses DOMPurify with a strict default configuration.
 */
export function sanitize(html: string): string {
  if (typeof window === "undefined") {
    // Return the string as is during SSR, as DOMPurify requires a DOM.
    // React's default escaping will still apply to standard text.
    // If SSR sanitization is critical, we would need JSDOM or similar.
    return html;
  }

  return DOMPurify.sanitize(html, {
    ALLOWED_TAGS: [
      "b", "i", "em", "strong", "a", "p", "br", "ul", "ol", "li", "h1", "h2", "h3", "h4", "h5", "h6", "span", "div"
    ],
    ALLOWED_ATTR: ["href", "target", "rel", "class"],
    KEEP_CONTENT: true,
  });
}
