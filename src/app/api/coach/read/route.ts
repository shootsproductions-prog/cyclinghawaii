// The AI-written coach's read.
//
//   GET   is the AI read switched on at all? (No secrets: a boolean.)
//   POST  { summary, password? }  ->  { read }  or an error the page
//         answers by keeping its rules-based read.
//
// Only identified callers reach the model (see lib/coach/access.ts):
// the site owner, or a signed-in visitor. Anonymous visitors get the
// rules-based read, which is computed in their browser. That keeps the
// Anthropic bill tied to people who can be counted.

import { NextResponse } from "next/server";
import { identify } from "@/lib/coach/access";
import { claudeRead, coachAiConfigured } from "@/lib/coach/claude";
import { passwordAttemptAllowed, rateLimit } from "@/lib/coach/rate-limit";
import { sanitizeSummary } from "@/lib/coach/summary";

export const dynamic = "force-dynamic";
// The model call can take a while; the default function timeout is too tight.
export const maxDuration = 60;

const PRIVATE = { "Cache-Control": "private, no-store" };
const MAX_BODY_BYTES = 40_000;
/** AI reads per caller per hour. A read only changes when the rides do. */
const READS_PER_HOUR = 6;

function reply(body: unknown, status = 200) {
  return NextResponse.json(body, { status, headers: PRIVATE });
}

export async function GET() {
  return reply({ configured: coachAiConfigured() });
}

export async function POST(request: Request) {
  if (!coachAiConfigured()) return reply({ error: "not-configured" }, 503);

  const raw = await request.text().catch(() => "");
  if (raw.length === 0 || raw.length > MAX_BODY_BYTES) return reply({ error: "bad-request" }, 400);
  let body: { summary?: unknown; password?: unknown };
  try {
    body = JSON.parse(raw);
  } catch {
    return reply({ error: "bad-request" }, 400);
  }

  if (body?.password !== undefined && !passwordAttemptAllowed(request)) {
    return reply({ error: "slow-down" }, 429);
  }
  const who = await identify(body?.password);
  if (!who) return reply({ error: "sign-in" }, 401);

  const summary = sanitizeSummary(body?.summary);
  if (!summary) return reply({ error: "bad-request" }, 400);

  if (!rateLimit(`read:${who.key}`, READS_PER_HOUR, 60 * 60 * 1000)) {
    return reply({ error: "slow-down" }, 429);
  }

  const result = await claudeRead(summary);
  if (!result.ok) {
    return reply({ error: result.reason }, result.reason === "rate-limited" ? 429 : 502);
  }
  return reply({ read: result.read });
}
