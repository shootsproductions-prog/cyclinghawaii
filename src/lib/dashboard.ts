// Dashboard data — strategic goals, active initiatives, milestones,
// and shipped log. Edit this file as the project evolves.
//
// The dashboard at /admin/dashboard renders live API metrics on top
// of these static editorial entries.

export type InitiativeStatus =
  | "blocked"
  | "active"
  | "queued"
  | "shipped";

export type InitiativeCategory =
  | "Platform"
  | "Content"
  | "Commerce"
  | "Community"
  | "Ops";

export interface Initiative {
  id: string;
  title: string;
  status: InitiativeStatus;
  category: InitiativeCategory;
  detail?: string;
  blockedBy?: string;
  /** Effort estimate in days — used for backlog scope */
  estimateDays?: number;
}

export interface Milestone {
  id: string;
  /** ISO YYYY-MM-DD */
  date: string;
  title: string;
  category: string;
  detail?: string;
  /** Optional URL for the related thing */
  url?: string;
}

export interface ShippedItem {
  id: string;
  title: string;
  category: InitiativeCategory;
  /** ISO date */
  date: string;
  url?: string;
}

// ────────────────────────────────────────────────────────
//  PROJECT START — used for "days since launch" calculation
// ────────────────────────────────────────────────────────
export const PROJECT_START_DATE = "2026-04-08";

// ────────────────────────────────────────────────────────
//  STRATEGIC GOALS — top-level objectives
// ────────────────────────────────────────────────────────
export const STRATEGIC_GOALS = [
  {
    id: "hub",
    title: "Become the Hawaiʻi cycling hub",
    detail:
      "Media + community + commerce + content under one brand. Powered by Laura.",
  },
  {
    id: "twelve",
    title: "First 12 riders connected via /roast",
    detail:
      "Each with their own page, peloton role, and Laura's roast running on their rides.",
  },
  {
    id: "video",
    title: "First Laura-narrated video on YouTube + IG",
    detail:
      "Drone footage + Laura voice + Cycling Hawaiʻi cuts. The visual identity layer.",
  },
  {
    id: "first-sale",
    title: "First Cycling Hawaiʻi store sale",
    detail:
      "Inner Circle line live. Stripe + Printful webhook automation wired.",
  },
];

// ────────────────────────────────────────────────────────
//  ACTIVE & QUEUED INITIATIVES
// ────────────────────────────────────────────────────────
export const INITIATIVES: Initiative[] = [
  // ── BLOCKED / WAITING ──
  {
    id: "strava-quota",
    title: "Strava athlete quota increase",
    status: "blocked",
    category: "Platform",
    detail:
      "Submitted Apr 28. Awaiting Strava review. Unlocks /roast OAuth for all club members.",
    blockedBy: "Strava developer review",
  },

  // ── ACTIVE ──
  {
    id: "drone-shoot",
    title: "Drone shoot — Kahakuloa sunrise",
    status: "active",
    category: "Content",
    detail:
      "May 23, 2026. Footage for /club hero refresh, manifesto trailer, /gear product shots, IG reels.",
  },

  // ── QUEUED ──
  {
    id: "cadence-article",
    title: "Cadence app deep-dive article",
    status: "queued",
    category: "Content",
    detail:
      "First long-form /log entry. Vini's screen builds + reasoning + Apple Watch Ultra workflow.",
    estimateDays: 1,
  },
  {
    id: "first-laura-video",
    title: "First Laura-narrated video",
    status: "queued",
    category: "Content",
    detail:
      "Manifesto trailer or gear review. Drone B-roll + Laura voice from /admin/laura-voice.",
    estimateDays: 1,
  },
  {
    id: "stripe-printful",
    title: "Stripe Payment Links → Printful webhook",
    status: "queued",
    category: "Commerce",
    detail:
      "Auto-fulfillment when a customer buys. Currently products are status: coming_soon.",
    estimateDays: 1,
  },
  {
    id: "voice-library",
    title: "Voice library (save MP3s to Vercel Blob)",
    status: "queued",
    category: "Ops",
    detail:
      "/admin/voice-library — re-download past Laura recordings, organize by topic.",
    estimateDays: 0.5,
  },
  {
    id: "gear-tbd-fills",
    title: "Fill remaining Pick-TBD gear cards",
    status: "queued",
    category: "Content",
    detail:
      "Helmet, lights, hydration, sunscreen, anti-chafe, cycling cap — specific brands.",
    estimateDays: 0.5,
  },
  {
    id: "strava-club-bio",
    title: "Update Strava club description",
    status: "queued",
    category: "Community",
    detail:
      "Drafted copy lives in chat. Vini pastes manually into Strava admin UI when ready.",
    estimateDays: 0.1,
  },
  {
    id: "tour-routes",
    title: "Build remaining 11 Tour de Maui routes in Strava",
    status: "queued",
    category: "Community",
    detail:
      "Stage 1 done (Pāʻia Sprint). 11 more month-stages to design at Vini's pace.",
    estimateDays: 3,
  },
  {
    id: "tour-segments",
    title: "Tour de Maui segment verification",
    status: "queued",
    category: "Platform",
    detail:
      "Each stage tied to a Strava segment. Code wired; segment IDs needed per stage.",
    estimateDays: 0.2,
  },
  {
    id: "spotlight",
    title: "Member Spotlight weekly blog entries",
    status: "queued",
    category: "Content",
    detail:
      "Rotates through The Twelve, oldest first. Mondays. <30 word Laura roast + permalink.",
    estimateDays: 1,
  },
];

// ────────────────────────────────────────────────────────
//  CALENDAR — upcoming dates
// ────────────────────────────────────────────────────────
export const MILESTONES: Milestone[] = [
  {
    id: "strava-followup-window",
    date: "2026-05-08",
    title: "Strava follow-up window opens (day 10)",
    category: "Ops",
    detail: "If still no response from Strava, send single short follow-up.",
  },
  {
    id: "drone-shoot",
    date: "2026-05-23",
    title: "Drone shoot — Kahakuloa sunrise",
    category: "Content",
    detail: "Hero footage, manifesto trailer, gear shots.",
  },
  {
    id: "ride-of-silence",
    date: "2026-05-23",
    title: "Ride of Silence (Big Island)",
    category: "Event",
  },
  {
    id: "cycle-to-the-sun",
    date: "2026-08-01",
    title: "Cycle to the Sun · Maui",
    category: "Event",
    url: "/events/cycle-to-the-sun-2026",
  },
  {
    id: "dick-evans",
    date: "2026-08-30",
    title: "Dick Evans Memorial · Oahu",
    category: "Event",
    url: "/events/dick-evans-memorial-2026",
  },
  {
    id: "honolulu-century",
    date: "2026-09-27",
    title: "Honolulu Century Ride · Oahu",
    category: "Event",
    url: "/events/honolulu-century-2026",
  },
  {
    id: "aloha-gravel",
    date: "2026-11-07",
    title: "Aloha Gravel · Maui",
    category: "Event",
    url: "/events/aloha-gravel-2026",
  },
  {
    id: "pedal-imua",
    date: "2026-12-05",
    title: "Pedal IMUA · Maui",
    category: "Event",
    url: "/events/pedal-imua-2026",
  },
];

// ────────────────────────────────────────────────────────
//  RECENTLY SHIPPED — newest first
// ────────────────────────────────────────────────────────
export const SHIPPED: ShippedItem[] = [
  {
    id: "laura-voice-studio",
    title: "Laura's Voice Studio (admin tool)",
    category: "Ops",
    date: "2026-05-02",
    url: "/admin/laura-voice",
  },
  {
    id: "gear-real-brands",
    title: "/gear — NeoPro, Shimano, Fizik, Dakine, GPS Setup, Nothing, Rhynowalk wired",
    category: "Content",
    date: "2026-05-02",
    url: "/gear",
  },
  {
    id: "gear-page",
    title: "/gear page launched (Wirecutter-style, no affiliate links)",
    category: "Content",
    date: "2026-05-02",
    url: "/gear",
  },
  {
    id: "404-page",
    title: "Custom 404 — Wrong area code, we're 808",
    category: "Platform",
    date: "2026-04-30",
  },
  {
    id: "store-printful",
    title: "/store — Printful integration live (3 Inner Circle products)",
    category: "Commerce",
    date: "2026-04-30",
    url: "/store",
  },
  {
    id: "events-platform",
    title: "/events platform with 5 marquee Hawaiʻi events",
    category: "Content",
    date: "2026-04-29",
    url: "/events",
  },
  {
    id: "club-restructure",
    title: "/club restructure — Roster-first, Compass merged into Inner Circle",
    category: "Community",
    date: "2026-04-29",
    url: "/club",
  },
  {
    id: "inner-circle",
    title: "The Inner Circle — circular activity viz on /club",
    category: "Community",
    date: "2026-04-29",
    url: "/club",
  },
  {
    id: "tour-de-maui",
    title: "Tour de Maui — 12 stages, 4 jerseys, segment verification",
    category: "Community",
    date: "2026-04-28",
    url: "/tour",
  },
  {
    id: "roast-oauth",
    title: "/roast OAuth flow + dynamic /[slug] rider pages",
    category: "Platform",
    date: "2026-04-27",
    url: "/roast",
  },
  {
    id: "club-page",
    title: "/club — Manifesto, Roster, Wall, Conditions, peloton roles",
    category: "Community",
    date: "2026-04-26",
    url: "/club",
  },
  {
    id: "stats-ledger",
    title: "Laura's Ledger — Year of Vini stats panel",
    category: "Platform",
    date: "2026-04-25",
  },
  {
    id: "live-tracker",
    title: "/live — full-screen Cadence tracker",
    category: "Platform",
    date: "2026-04-25",
    url: "/live",
  },
];

// ─── Helpers ─────────────────────────────────────────────

export function daysSince(isoDate: string, today: Date = new Date()): number {
  const start = new Date(isoDate + "T00:00:00");
  const ms = today.getTime() - start.getTime();
  return Math.floor(ms / (1000 * 60 * 60 * 24));
}

export function daysUntil(isoDate: string, today: Date = new Date()): number {
  const target = new Date(isoDate + "T00:00:00");
  const ms = target.getTime() - today.getTime();
  return Math.ceil(ms / (1000 * 60 * 60 * 24));
}

export function statusColor(status: InitiativeStatus): {
  bg: string;
  text: string;
  border: string;
} {
  switch (status) {
    case "blocked":
      return {
        bg: "bg-yellow-500/10",
        text: "text-yellow-700",
        border: "border-yellow-500/40",
      };
    case "active":
      return {
        bg: "bg-strava/10",
        text: "text-strava",
        border: "border-strava/40",
      };
    case "queued":
      return {
        bg: "bg-mist/10",
        text: "text-mist",
        border: "border-border",
      };
    case "shipped":
      return {
        bg: "bg-emerald-500/10",
        text: "text-emerald-700",
        border: "border-emerald-500/30",
      };
  }
}

export function categoryColor(cat: InitiativeCategory): string {
  switch (cat) {
    case "Platform":
      return "text-[#7c3aed]";
    case "Content":
      return "text-[#0ea5e9]";
    case "Commerce":
      return "text-[#10b981]";
    case "Community":
      return "text-strava";
    case "Ops":
      return "text-mist";
  }
}
