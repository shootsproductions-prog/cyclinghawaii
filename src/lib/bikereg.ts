// BikeReg integration — read-only.
//
// BikeReg doesn't expose a usable public search/detail API, but every
// event page embeds clean JSON-LD structured data (schema.org Event).
// We fetch the public event page and pull the JSON-LD blob out of it.
// This is fair game — JSON-LD is published precisely for third-party
// consumption (Google's event rich results work the same way).
//
// Used by /events and /events/[slug] to keep dates and registration
// status in sync without us hand-editing every time an organizer
// reschedules. Editorial fields (description, lauraTake, coverPhoto)
// stay local in events.ts — BikeReg only provides the facts.
//
// Caching: Next.js fetch cache, 24h revalidation. If a fetch fails we
// fall back to whatever the local events.ts file says — never block a
// page render on a flaky external host.
//
// Slug format: the path under bikereg.com/ — e.g. `cycle-to-the-sun`,
// `demrr26`, or a bare numeric event ID like `72105`.

export type BikeRegEventStatus =
  | "EventScheduled"
  | "EventRescheduled"
  | "EventCancelled"
  | "EventPostponed"
  | "EventMovedOnline"
  | "Unknown";

export interface BikeRegEvent {
  /** BikeReg permalink slug, e.g. "cycle-to-the-sun" or "72105". */
  slug: string;
  /** Canonical BikeReg event URL (after redirect resolution). */
  url: string;
  /** Event name as BikeReg knows it. */
  name?: string;
  /** ISO date YYYY-MM-DD. */
  startDate?: string;
  /** ISO date YYYY-MM-DD. */
  endDate?: string;
  /** ISO date YYYY-MM-DD. Set when the event was moved from a prior date. */
  previousStartDate?: string;
  status: BikeRegEventStatus;
  city?: string;
  region?: string;
  postalCode?: string;
  street?: string;
  latitude?: number;
  longitude?: number;
  organizer?: string;
  /** When this snapshot was fetched (ISO timestamp). */
  fetchedAt: string;
}

const SCHEMA_STATUS_PREFIX = "https://schema.org/";

// Normalize "https://schema.org/EventRescheduled" → "EventRescheduled".
function normalizeStatus(value: unknown): BikeRegEventStatus {
  if (typeof value !== "string") return "Unknown";
  const tail = value.startsWith(SCHEMA_STATUS_PREFIX)
    ? value.slice(SCHEMA_STATUS_PREFIX.length)
    : value;
  switch (tail) {
    case "EventScheduled":
    case "EventRescheduled":
    case "EventCancelled":
    case "EventPostponed":
    case "EventMovedOnline":
      return tail;
    default:
      return "Unknown";
  }
}

// Trim "YYYY-MM-DDTHH..." down to "YYYY-MM-DD" if it's a full ISO ts.
function dateOnly(value: unknown): string | undefined {
  if (typeof value !== "string") return undefined;
  const m = value.match(/^(\d{4}-\d{2}-\d{2})/);
  return m?.[1];
}

interface SchemaEvent {
  "@type"?: string | string[];
  name?: string;
  url?: string;
  startDate?: string;
  endDate?: string;
  previousStartDate?: string;
  eventStatus?: string;
  location?:
    | {
        address?: {
          addressLocality?: string;
          addressRegion?: string;
          postalCode?: string;
          streetAddress?: string;
        };
        latitude?: number;
        longitude?: number;
      }
    | Array<unknown>;
  organizer?: { name?: string } | Array<{ name?: string }>;
}

// Find the schema.org Event block in a JSON-LD payload. BikeReg pages
// each carry a single <script type="application/ld+json"> with an Event
// object at the root — but other publishers nest things in @graph
// arrays, so we tolerate both.
function findEventNode(parsed: unknown): SchemaEvent | null {
  if (!parsed) return null;
  if (Array.isArray(parsed)) {
    for (const node of parsed) {
      const hit = findEventNode(node);
      if (hit) return hit;
    }
    return null;
  }
  if (typeof parsed !== "object") return null;
  const obj = parsed as Record<string, unknown>;
  const type = obj["@type"];
  if (typeof type === "string" && type.endsWith("Event")) {
    return obj as SchemaEvent;
  }
  if (Array.isArray(type) && type.some((t) => typeof t === "string" && t.endsWith("Event"))) {
    return obj as SchemaEvent;
  }
  const graph = obj["@graph"];
  if (Array.isArray(graph)) return findEventNode(graph);
  return null;
}

/**
 * Fetch and parse a single BikeReg event by its slug/permalink.
 *
 * Returns `null` on any failure (network, missing block, parse error)
 * so callers can render the local-only fallback without blowing up.
 *
 * Cached by Next.js fetch cache for 24h.
 */
export async function fetchBikeRegEvent(
  slug: string
): Promise<BikeRegEvent | null> {
  const url = `https://www.bikereg.com/${slug}`;
  try {
    const res = await fetch(url, {
      // 24h revalidation; tagged so we can manually purge later if we
      // ever wire an admin "refresh BikeReg" button.
      next: { revalidate: 86400, tags: ["bikereg", `bikereg:${slug}`] },
      headers: {
        // Without a real-ish UA BikeReg sometimes returns 403.
        "User-Agent":
          "Mozilla/5.0 (compatible; CyclingHawaiiBot/1.0; +https://cyclinghawaii.com)",
      },
    });
    if (!res.ok) return null;
    const html = await res.text();

    // Pull every JSON-LD script block and try each.
    const blocks = [
      ...html.matchAll(
        /<script[^>]+type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi
      ),
    ];
    for (const match of blocks) {
      const raw = match[1].trim();
      if (!raw) continue;
      let parsed: unknown;
      try {
        parsed = JSON.parse(raw);
      } catch {
        continue;
      }
      const node = findEventNode(parsed);
      if (!node) continue;

      // schema.org allows location to be an object OR an array. Pick
      // the first object-ish entry either way, then pull address +
      // coords out of it defensively.
      const locRaw = Array.isArray(node.location)
        ? node.location[0]
        : node.location;
      const loc =
        locRaw && typeof locRaw === "object"
          ? (locRaw as {
              address?: {
                addressLocality?: string;
                addressRegion?: string;
                postalCode?: string;
                streetAddress?: string;
              };
              latitude?: number;
              longitude?: number;
            })
          : undefined;
      const address = loc?.address;
      const organizer = Array.isArray(node.organizer)
        ? node.organizer[0]
        : node.organizer;

      return {
        slug,
        url: node.url ?? url,
        name: node.name,
        startDate: dateOnly(node.startDate),
        endDate: dateOnly(node.endDate),
        previousStartDate: dateOnly(node.previousStartDate),
        status: normalizeStatus(node.eventStatus),
        city: address?.addressLocality,
        region: address?.addressRegion,
        postalCode: address?.postalCode,
        street: address?.streetAddress,
        latitude: loc?.latitude,
        longitude: loc?.longitude,
        organizer: organizer?.name,
        fetchedAt: new Date().toISOString(),
      };
    }
    return null;
  } catch (err) {
    console.warn(`[bikereg] fetch failed for ${slug}:`, err);
    return null;
  }
}

/**
 * Fetch many BikeReg events in parallel. Missing/failed entries are
 * dropped from the result map silently.
 */
export async function fetchBikeRegEvents(
  slugs: string[]
): Promise<Map<string, BikeRegEvent>> {
  const unique = [...new Set(slugs)];
  const results = await Promise.all(unique.map(fetchBikeRegEvent));
  const map = new Map<string, BikeRegEvent>();
  for (const r of results) {
    if (r) map.set(r.slug, r);
  }
  return map;
}
