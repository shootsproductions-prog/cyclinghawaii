// Who is asking? Access rules for the coach's server routes.
//
// The coach page itself is public and works with files and sample
// data that never leave the browser. Only two things need the server,
// and both are private:
//
//   Strava rides   /api/coach/activities
//   AI read        /api/coach/read
//
// Three kinds of caller can be told apart:
//
//   owner    The site owner. Proven either by the admin password (the
//            same ADMIN_PASSWORD that gates /admin/*) or by an Auth.js
//            session whose Strava athlete id equals STRAVA_ATHLETE_ID.
//            Gets the owner's rides through the site's own Strava token.
//
//   rider    A signed-in visitor whose Auth.js account is a Strava
//            account. Their athlete id comes from Strava's OAuth, not
//            from anything they typed. They get THEIR OWN rides, and
//            only if they have also connected Strava through the
//            existing rider flow (/api/auth/strava/start), which is
//            where the activity-read token is stored.
//
//   member   Signed in some other way (Google). No Strava rides, but
//            identifiable, so allowed to request the AI read.
//
// Anyone else is anonymous: no Strava data, no AI calls. Nobody can
// ever name whose rides they want; identity alone decides.
//
// Server-only.

import { createHash, timingSafeEqual } from "crypto";
import { auth } from "@/auth";

export type CoachIdentity =
  | { kind: "owner"; key: string }
  | { kind: "rider"; key: string; athleteId: number }
  | { kind: "member"; key: string };

function passwordMatches(candidate: unknown): boolean {
  const expected = process.env.ADMIN_PASSWORD;
  if (!expected || typeof candidate !== "string" || candidate.length === 0) return false;
  // Hash both sides so the comparison is constant-time whatever their lengths.
  const a = createHash("sha256").update(candidate).digest();
  const b = createHash("sha256").update(expected).digest();
  return timingSafeEqual(a, b);
}

export async function identify(password?: unknown): Promise<CoachIdentity | null> {
  if (passwordMatches(password)) return { kind: "owner", key: "owner" };

  let user: { id?: string; stravaAthleteId?: string } | undefined;
  try {
    user = (await auth())?.user;
  } catch (error) {
    // No database configured, or the session lookup failed: treat as signed out.
    console.warn("[coach] session lookup failed:", error instanceof Error ? error.message : error);
    return null;
  }
  if (!user?.id) return null;

  const athleteId = user.stravaAthleteId;
  if (athleteId && process.env.STRAVA_ATHLETE_ID && athleteId === process.env.STRAVA_ATHLETE_ID) {
    return { kind: "owner", key: "owner" };
  }
  if (athleteId && /^\d{1,15}$/.test(athleteId)) {
    return { kind: "rider", key: `user:${user.id}`, athleteId: Number(athleteId) };
  }
  return { kind: "member", key: `user:${user.id}` };
}
