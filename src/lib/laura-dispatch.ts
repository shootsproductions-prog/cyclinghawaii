// Laura's Dispatch — a bi-weekly editorial roundup, solo-journal edition.
//
// Every ~14 days, Laura reads Vini's recent rides (via the blog pipeline)
// and writes a 180-260 word reflection in her voice: dry, sarcastic,
// affectionate underneath. Mentions specific rides by name. Nudges Vini
// forward. Roasts when earned.
//
// Why not the club feed anymore: Strava closed the club endpoints
// (/clubs/{id}/activities now 404s), and the site has pivoted to being
// Vini's personal cycling journal. The Dispatch narrates his two weeks,
// not a club's.
//
// Generation strategy (unchanged from the old flow):
//   - Read the most recent stored dispatch. If it's <14 days old, return
//     it unchanged. Cheap, deterministic, no API hit on every render.
//   - If it's stale (or there's nothing), build a fresh prompt from the
//     recent blog entries, call Claude, store the result, return it.
//   - On any failure (missing API key, network, parse), return the
//     stored copy if any — never block the page render on Anthropic.
//
// BLOB_KEY was bumped from "laura-roundup.json" so the next render under
// the solo prompt generates fresh instead of serving a stale club-era
// post. The old blob is orphaned; nothing points at it anymore.

import Anthropic from "@anthropic-ai/sdk";
import { put, list } from "@vercel/blob";
import type { BlogEntry } from "./blog";

const BLOB_KEY = "laura-dispatch-solo.json";
// ~14 days with a small buffer so a Sunday-morning read still triggers
// regeneration on the two-week boundary rather than sliding another day.
const REFRESH_AFTER_MS = 13.5 * 24 * 60 * 60 * 1000;
const MODEL = "claude-haiku-4-5";

// Aloha Gravel date — same ISO used on the homepage. Duplicated here so
// the Dispatch prompt can tailor its AG mention guidance without pulling
// a page-level constant into a lib module.
const ALOHA_GRAVEL_ISO = "2026-11-07";

export interface DispatchRoundup {
  title: string;
  body: string;
  /** ISO timestamp — used to decide if we should regenerate. */
  generatedAt: string;
  /** Ride IDs Laura referenced, in case the UI wants to cross-link. */
  rideIds: number[];
}

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

// ─── Storage helpers ────────────────────────────

async function loadLatest(): Promise<DispatchRoundup | null> {
  try {
    const blobs = await list({ prefix: BLOB_KEY });
    if (blobs.blobs.length === 0) return null;
    blobs.blobs.sort(
      (a, b) =>
        new Date(b.uploadedAt).getTime() - new Date(a.uploadedAt).getTime()
    );
    const res = await fetch(blobs.blobs[0].url, { cache: "no-store" });
    if (!res.ok) return null;
    return (await res.json()) as DispatchRoundup;
  } catch (err) {
    console.warn("[laura-dispatch] load failed:", err);
    return null;
  }
}

async function save(roundup: DispatchRoundup): Promise<void> {
  try {
    await put(BLOB_KEY, JSON.stringify(roundup, null, 2), {
      access: "public",
      contentType: "application/json",
      allowOverwrite: true,
    });
  } catch (err) {
    console.error("[laura-dispatch] save failed:", err);
  }
}

// ─── Prompt construction ───────────────────────────

function daysUntilAG(): number {
  const target = new Date(ALOHA_GRAVEL_ISO + "T00:00:00").getTime();
  return Math.ceil((target - Date.now()) / 86400000);
}

function buildPrompt(entries: BlogEntry[]): string {
  // Pull the most recent 10 entries into one-line summaries so Laura has
  // specific rides to reference without being overwhelmed.
  const rideLines = entries
    .slice(0, 10)
    .map(
      (e) =>
        `- ${e.date}: "${e.rideName}" — ${e.distance} mi, ${e.elevation} ft`
    )
    .join("\n");

  // Dynamic guidance about mentioning Aloha Gravel. Changes as the event
  // approaches so Laura doesn't ignore it or overweight it inappropriately.
  const ag = daysUntilAG();
  let agGuidance = "";
  if (ag < 0) {
    agGuidance =
      "Aloha Gravel is in the rearview. Reference it in the past tense if it fits.";
  } else if (ag <= 7) {
    agGuidance = `Aloha Gravel is in ${ag} days. The training is almost done — reference the taper, the stakes, the readiness (or lack of it). Set the stage.`;
  } else if (ag <= 30) {
    agGuidance = `Aloha Gravel is in ${ag} days. You can reference the build-up — training rides, the terrain, the volume — if it fits naturally. Don't force it.`;
  } else {
    agGuidance = `Aloha Gravel is ${ag} days out. Only mention it if the rides lean that way.`;
  }

  return `You are Laura Ryder, Vini's AI Chief Reality Officer and resident roaster. You write The Dispatch — a bi-weekly editorial that reflects on Vini's cycling across the Hawaiian islands. The whole site is Vini's personal cycling journal; the Dispatch is your voice on it.

VOICE
- Dry. Sarcastic. Affectionate underneath. Never mean.
- You know Vini well. His rides, his terrain, his tendency to blow up on the way up Haleakalā. You write about one rider, not a team or club.
- You believe cycling is great but takes itself too seriously, and your job is to puncture that lightly.
- Clean prose. No emoji. No hashtags. No exclamation points.
- You are not a hype account. You are a bookkeeper with strong opinions who happens to narrate one person's rides.

INPUTS

Vini's recent rides (last ~2 weeks, newest first):
${rideLines || "(a quiet two weeks — reference the silence)"}

AG CONTEXT
${agGuidance}

WRITING RULES
- Length: 180-260 words. Tight prose. No padding.
- Reference at least 3 specific rides by name. Make each naming feel earned, not listed. If there are fewer than 3 rides, work with what's there and name the silence.
- Don't repeat the stat numbers verbatim — translate them ("a small mountain's worth of climbing," "a distance you'd call a commute in Texas").
- Open with a single short sentence that sets the mood of these two weeks. Not a date.
- Reference the two-week window naturally when it helps ("across the last two weeks," "these fourteen days," "this Dispatch"). Don't force it into every paragraph.
- Close with a Laura line — a nudge, a jab, or a quiet observation about where Vini's riding is going.
- Plain text only. No markdown. No headings. Just paragraphs separated by blank lines.
- DO NOT prefix the body with the date.
- Address Vini directly only when it helps. Mostly write ABOUT him in third person; it reads like you're sketching him for a reader.

OUTPUT FORMAT
Return ONLY a JSON object, no preamble:
{
  "title": "<6-10 word title in your voice>",
  "body": "<the post itself, plain paragraphs>"
}`;
}

// ─── Public API ─────────────────────────────────

/**
 * Return the current Dispatch. Generates a new one if the stored copy
 * is older than ~14 days, or if nothing is stored yet. Safe to call
 * from a server component during ISR render.
 *
 * Caller passes the current list of BlogEntry — one per Vini ride,
 * already roasted by Laura in blog.ts. The Dispatch is a different beast
 * (editorial reflection across many rides, not one), so the two
 * generators coexist happily.
 */
export async function getDispatch(
  entries: BlogEntry[]
): Promise<DispatchRoundup | null> {
  const existing = await loadLatest();
  const now = Date.now();

  // Fresh enough — serve from cache.
  if (
    existing &&
    now - new Date(existing.generatedAt).getTime() < REFRESH_AFTER_MS
  ) {
    return existing;
  }

  // Need a fresh one. If anything goes wrong, fall back to existing.
  if (!process.env.ANTHROPIC_API_KEY) {
    console.warn("[laura-dispatch] no ANTHROPIC_API_KEY — serving stored copy");
    return existing;
  }

  try {
    const prompt = buildPrompt(entries);
    const res = await client.messages.create({
      model: MODEL,
      max_tokens: 800,
      messages: [{ role: "user", content: prompt }],
    });

    const text = res.content
      .filter((b) => b.type === "text")
      .map((b) => (b as { text: string }).text)
      .join("\n")
      .trim();

    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      console.warn("[laura-dispatch] no JSON in response, keeping existing");
      return existing;
    }
    const parsed = JSON.parse(jsonMatch[0]) as {
      title?: string;
      body?: string;
    };
    if (!parsed.title || !parsed.body) {
      console.warn("[laura-dispatch] malformed JSON, keeping existing");
      return existing;
    }

    const roundup: DispatchRoundup = {
      title: parsed.title.trim(),
      body: parsed.body.trim(),
      generatedAt: new Date().toISOString(),
      rideIds: entries.slice(0, 10).map((e) => e.rideId),
    };
    await save(roundup);
    return roundup;
  } catch (err) {
    console.error("[laura-dispatch] generation failed:", err);
    return existing;
  }
}
