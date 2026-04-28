// Persistent encrypted storage for connected riders (OAuth tokens + profile).
// Each rider lives at riders/{slug}.json in Vercel Blob, AES-GCM encrypted.

import { put, list, del } from "@vercel/blob";
import { encrypt, decrypt } from "./rider-crypto";

export interface Rider {
  athleteId: number;
  firstname: string;
  lastname: string;
  profile: string;
  city?: string;
  state?: string;
  slug: string;
  // OAuth tokens
  accessToken: string;
  refreshToken: string;
  // Unix seconds when access token expires
  tokenExpiresAt: number;
  // First connection time (Unix ms)
  createdAt: number;
}

const RIDER_PREFIX = "riders/";

// Slugs that conflict with existing routes or reserved names.
const RESERVED_SLUGS = new Set([
  "api",
  "club",
  "roast",
  "log",
  "live",
  "admin",
  "login",
  "logout",
  "connect",
  "disconnect",
  "vini",
  "laura",
  "about",
  "contact",
  "privacy",
  "terms",
  "settings",
  "_next",
  "favicon",
  "robots",
  "sitemap",
  "public",
  "images",
  "static",
]);

export function isReservedSlug(slug: string): boolean {
  return RESERVED_SLUGS.has(slug.toLowerCase());
}

function slugify(name: string): string {
  return name
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "") // strip accents
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

export async function generateSlug(
  firstname: string,
  lastname: string,
  athleteId: number
): Promise<string> {
  const baseFirst = slugify(firstname);
  const baseLast = slugify(lastname);
  const candidates = [
    baseFirst,
    `${baseFirst}-${baseLast}`,
    `${baseFirst}-${baseLast}-${String(athleteId).slice(-4)}`,
    `${baseFirst}-${athleteId}`,
  ].filter((c) => c && !isReservedSlug(c));

  for (const c of candidates) {
    const existing = await getRiderBySlug(c);
    // If the slug is taken by THIS athlete, that's fine (they're reconnecting).
    if (!existing || existing.athleteId === athleteId) return c;
  }
  // Final fallback: athleteId only
  return `rider-${athleteId}`;
}

function blobPathForSlug(slug: string): string {
  return `${RIDER_PREFIX}${slug}.json`;
}

export async function saveRider(rider: Rider): Promise<void> {
  const json = JSON.stringify(rider);
  const encrypted = encrypt(json);
  await put(blobPathForSlug(rider.slug), encrypted, {
    access: "public", // blob URL public, but content is encrypted
    contentType: "application/octet-stream",
    addRandomSuffix: false,
    allowOverwrite: true,
  });
}

export async function getRiderBySlug(slug: string): Promise<Rider | null> {
  if (!slug) return null;
  try {
    const { blobs } = await list({ prefix: blobPathForSlug(slug) });
    const exact = blobs.find((b) => b.pathname === blobPathForSlug(slug));
    if (!exact) return null;
    const res = await fetch(exact.url, { cache: "no-store" });
    if (!res.ok) return null;
    const encrypted = await res.text();
    const json = decrypt(encrypted);
    return JSON.parse(json) as Rider;
  } catch (err) {
    console.error("getRiderBySlug failed:", err);
    return null;
  }
}

export async function getRiderByAthleteId(
  athleteId: number
): Promise<Rider | null> {
  const all = await listRiders();
  return all.find((r) => r.athleteId === athleteId) ?? null;
}

export async function listRiders(): Promise<Rider[]> {
  try {
    const { blobs } = await list({ prefix: RIDER_PREFIX });
    const riders: Rider[] = [];
    for (const blob of blobs) {
      try {
        const res = await fetch(blob.url, { cache: "no-store" });
        if (!res.ok) continue;
        const encrypted = await res.text();
        const json = decrypt(encrypted);
        riders.push(JSON.parse(json) as Rider);
      } catch (err) {
        console.error(`Failed to read rider blob ${blob.pathname}:`, err);
      }
    }
    return riders;
  } catch (err) {
    console.error("listRiders failed:", err);
    return [];
  }
}

export async function deleteRider(slug: string): Promise<void> {
  try {
    const { blobs } = await list({ prefix: blobPathForSlug(slug) });
    for (const b of blobs) {
      if (b.pathname === blobPathForSlug(slug)) {
        await del(b.url);
      }
    }
  } catch (err) {
    console.error("deleteRider failed:", err);
  }
}
