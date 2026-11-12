// A small in-memory rate limit for the coach's server routes: AI reads
// per caller, and password guesses per address.
//
// Best effort only: each serverless instance keeps its own counts. It
// stops a stuck client or a casual abuser from running up the AI bill
// or hammering the admin password; it is not a security boundary.

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

/** The caller's address as the platform reports it. Only used as a rate-limit key. */
export function clientAddress(request: Request): string {
  return request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown";
}

/** Password guesses allowed per address in ten minutes, across the coach routes. */
export function passwordAttemptAllowed(request: Request): boolean {
  return rateLimit(`pw:${clientAddress(request)}`, 12, 10 * 60 * 1000);
}
