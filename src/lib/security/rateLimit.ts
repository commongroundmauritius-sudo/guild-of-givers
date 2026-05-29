/**
 * Simple Server-Side Rate Limiter Placeholder.
 * In production, this should use a persistent store like Redis (via Cloudflare KV or Upstash).
 */

interface RateLimitConfig {
  windowMs: number;
  max: number;
}

const memoryStore = new Map<string, { count: number; resetTime: number }>();

export async function rateLimit(
  identifier: string,
  action: string,
  config: RateLimitConfig = { windowMs: 60000, max: 10 }
) {
  const key = `${action}:${identifier}`;
  const now = Date.now();
  const record = memoryStore.get(key);

  if (!record || now > record.resetTime) {
    memoryStore.set(key, { count: 1, resetTime: now + config.windowMs });
    return { success: true };
  }

  if (record.count >= config.max) {
    throw new Error(`Rate limit exceeded for ${action}. Please try again later.`);
  }

  record.count += 1;
  return { success: true };
}

/**
 * Derives a reliable client identifier for rate limiting.
 */
export function getClientIdentifier(request?: Request): string {
  // In Cloudflare Workers, we can use request.headers.get('cf-connecting-ip')
  if (request) {
    const ip = request.headers.get('cf-connecting-ip') || request.headers.get('x-forwarded-for');
    if (ip) return ip;
  }
  return 'anonymous';
}
