// A small in-memory rate limit for the coach's AI route.
//
// Best effort only: each serverless instance keeps its own counts. It
// stops a stuck client or a casual abuser from running up the AI bill;
// it is not a security boundary.

const hits = new Map<string, number[]>();

/** True if this call is allowed; false once `limit` calls have been made within `windowMs`. */
export function rateLimit(key: string, limit: number, windowMs: number, now = Date.now()): boolean {
  const recent = (hits.get(key) ?? []).filter((t) => now - t < windowMs);
  if (recent.length >= limit) {
    hits.set(key, recent);
    return false;
  }
  recent.push(now);
  hits.set(key, recent);
  if (hits.size > 5000) hits.clear();
  return true;
}
