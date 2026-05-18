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
    id: "launch",
    title: "Public launch · June 21, 2026 (summer solstice)",
    detail:
      "Homepage = the Club. Honor Roll live. Laura's roundup auto-publishing weekly. Stickers in the store. Soft launch invites sent June 7-14, public push June 21.",
  },
  {
    id: "cycle-to-sun",
    title: "Reach 50 active club members by Cycle to the Sun (Aug 1)",
    detail:
      "Group text invites + Instagram + Vini's Strava network. Each new member = one more story for the Honor Roll. Race day on the mountain is the moment.",
  },
  {
    id: "hub",
    title: "Become the Hawaiʻi cycling hub",
    detail:
      "Media + community + commerce + content under one brand. Powered by Laura.",
  },
  {
    id: "first-sale",
    title: "First Cycling Hawaiʻi store sale",
    detail:
      "Inner Circle line + Cycle to the Sun limited-edition sticker + numbered Twelve sticker. Stripe + Printful webhook automation pending.",
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
      "Submitted Apr 28 — Day 20 today. Follow-up email queued for May 19 (tomorrow). Once approved: re-enable Strava sign-in on /signin, build basic /[username] roster pages for The Twelve.",
    blockedBy: "Strava developer review",
  },

  // ── ACTIVE — the June 21 launch sprint ──
  {
    id: "drone-shoot",
    title: "Drone shoot — Davin · Kahakuloa coast",
    status: "active",
    category: "Content",
    detail:
      "May 24, 2026 (sunrise) — 6 days out. Aerials of the ranch → Kahakuloa loop. New hero photo for homepage + IG launch grid + manifesto trailer.",
  },
  {
    id: "photo-shoot",
    title: "Photo shoot — Rodrigo · Polipoli (or Thompson Rd plan B)",
    status: "active",
    category: "Content",
    detail:
      "May 26, 2026 — 8 days out. Portraits + lifestyle + gear stills. Powers /about portrait, /rides hero refresh, Instagram launch sequence, sticker pack mockups.",
  },
  {
    id: "cts-sticker",
    title: "Cycle to the Sun limited-edition sticker design",
    status: "active",
    category: "Commerce",
    detail:
      "Vini designs in Claude Design — uploads to Printful by June 1. Listed on /store + homepage merch teaser by June 7. Hands out at race day Aug 1.",
    estimateDays: 1,
  },
  {
    id: "twelve-sticker",
    title: "The Twelve numbered sticker (#1-#12)",
    status: "active",
    category: "Commerce",
    detail:
      "Identity object — each Twelve member gets a numbered sticker mailed when they earn their roster spot. Design + Printful upload target June 10.",
    estimateDays: 1,
  },
  {
    id: "founder-letter",
    title: "Founder letter for /about page",
    status: "active",
    category: "Content",
    detail:
      "Vini's voice, one page, why Cycling Hawai'i exists. Replaces the current Manifesto placeholder. Target post-portrait-shoot so it's framed with Rodrigo's portrait.",
    estimateDays: 0.5,
  },

  // ── QUEUED — for launch week (June 14-21) ──
  {
    id: "soft-launch",
    title: "Soft launch invites — 10-15 cyclists",
    status: "queued",
    category: "Community",
    detail:
      "Window: June 7-14. Personal group text + DM template to friends in the Maui cycling community. Ask 3-5 to add #cyclinghawaii to a ride so the Wall + Honor Roll feel populated by launch day.",
    estimateDays: 0.3,
  },
  {
    id: "ig-countdown",
    title: "Instagram launch countdown grid",
    status: "queued",
    category: "Content",
    detail:
      "7-day countdown grid (June 14-20) + launch-day post (June 21) + 7-day follow-up sequence. Built in Claude Design with the May 24/26 media as the visual fuel.",
    estimateDays: 2,
  },
  {
    id: "launch-laura-posts",
    title: "4 Laura launch-week blog posts",
    status: "queued",
    category: "Content",
    detail:
      "Drafts: (1) Launch manifesto, (2) Cycle to the Sun preview, (3) Maui cycling primer, (4) 'What is The Twelve' explainer. Schedules June 21-25.",
    estimateDays: 2,
  },
  {
    id: "sunriders-conversation",
    title: "Sunriders coffee — plant the partnership seed",
    status: "queued",
    category: "Community",
    detail:
      "Casual conversation, no formal pitch yet. Tell them you're building this, you want them to know. Member discount + partner-shop badge becomes a Year 2 conversation when membership is real.",
    estimateDays: 0.2,
  },
  {
    id: "newsletter",
    title: "Email newsletter capture (Resend)",
    status: "queued",
    category: "Platform",
    detail:
      "Captures the 30-40% of visitors who won't join Strava. Form on homepage footer + dedicated /signup page. Pre-launch tease email June 14, launch email June 21, follow-up June 28.",
    estimateDays: 1,
  },
  {
    id: "og-images",
    title: "OG / social images for top pages",
    status: "queued",
    category: "Platform",
    detail:
      "1200×630 cards for /, /about, /events, /events/[slug], /log, /store. Brand-consistent so Instagram + Strava link previews look intentional.",
    estimateDays: 1,
  },

  // ── QUEUED — post-launch / month-2 ──
  {
    id: "first-laura-video",
    title: "First Laura-narrated video",
    status: "queued",
    category: "Content",
    detail:
      "Launch trailer cut with drone + portrait b-roll from May 24/26 + Laura voice from /admin/laura-voice. Drops launch week.",
    estimateDays: 1,
  },
  {
    id: "stripe-printful",
    title: "Stripe Payment Links → Printful webhook",
    status: "queued",
    category: "Commerce",
    detail:
      "Auto-fulfillment when a customer buys. Needed before serious merch volume. First sample ordered → flip products to published.",
    estimateDays: 1,
  },
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
    id: "spotlight",
    title: "Member Spotlight weekly blog entries",
    status: "queued",
    category: "Content",
    detail:
      "Rotates through The Twelve, oldest first. Mondays. Pairs with Laura's auto-roundup as the editorial bedrock.",
    estimateDays: 1,
  },
  {
    id: "tour-routes",
    title: "Build remaining 11 Tour de Maui routes in Strava",
    status: "queued",
    category: "Community",
    detail:
      "Stage 1 done (Pāʻia Sprint). 11 more month-stages to design at Vini's pace. Likely post-launch — Tour de Maui as Year-2 layer.",
    estimateDays: 3,
  },
  {
    id: "gear-tbd-fills",
    title: "Fill remaining Pick-TBD gear cards",
    status: "queued",
    category: "Content",
    detail:
      "Helmet, lights, hydration, sunscreen, anti-chafe, cycling cap. Lower priority than launch — better to ship 7 great reviews than 14 thin ones.",
    estimateDays: 0.5,
  },
];

// ────────────────────────────────────────────────────────
//  CALENDAR — upcoming dates
// ────────────────────────────────────────────────────────
export const MILESTONES: Milestone[] = [
  {
    id: "strava-followup",
    date: "2026-05-19",
    title: "Strava follow-up email (day 21)",
    category: "Ops",
    detail: "Send polished follow-up to developers@strava.com if quota review still silent.",
  },
  {
    id: "ride-of-silence",
    date: "2026-05-23",
    title: "Ride of Silence (Big Island)",
    category: "Event",
  },
  {
    id: "drone-shoot",
    date: "2026-05-24",
    title: "Drone shoot — Davin · Kahakuloa coast",
    category: "Content",
    detail: "Sunrise aerials of ranch → Kahakuloa loop. Hero footage for launch.",
  },
  {
    id: "photo-shoot",
    date: "2026-05-26",
    title: "Photo shoot — Rodrigo · Polipoli (or Thompson Rd)",
    category: "Content",
    detail: "Portraits, lifestyle, gear. Sea-to-summit complement to drone day.",
  },
  {
    id: "cts-sticker-deadline",
    date: "2026-06-01",
    title: "Cycle to the Sun sticker uploaded to Printful",
    category: "Commerce",
    detail: "Vini's design ready, listed on /store + homepage merch teaser by June 7.",
  },
  {
    id: "soft-launch-start",
    date: "2026-06-07",
    title: "Soft launch window opens — first invites",
    category: "Launch",
    detail: "Personal group text to 10-15 cyclists. Walk through the join flow.",
  },
  {
    id: "twelve-sticker-deadline",
    date: "2026-06-10",
    title: "The Twelve numbered sticker live",
    category: "Commerce",
    detail: "Numbered #1-#12 stickers mailed when riders earn their roster spot.",
  },
  {
    id: "ig-countdown-start",
    date: "2026-06-14",
    title: "Instagram launch countdown starts",
    category: "Launch",
    detail: "Daily posts through June 20. Email pre-launch tease same day.",
  },
  {
    id: "launch-day",
    date: "2026-06-21",
    title: "🚀 LAUNCH — Cycling Hawai'i goes public · summer solstice",
    category: "Launch",
    detail: "Morning: Strava post + Instagram post + email + group text. Laura's launch manifesto goes live.",
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
    id: "drive-cleanup",
    title: "Cycling Hawai'i hard drive — 185 GB of duplicates cleared + 39 loose files organized",
    category: "Ops",
    date: "2026-05-18",
  },
  {
    id: "how-to-join",
    title: "Homepage — 'How to Join' 3-step on-ramp section",
    category: "Community",
    date: "2026-05-18",
    url: "/",
  },
  {
    id: "honor-roll",
    title: "Honor Roll — 10 deterministic distinctions (Rouleur, Climber, Lanterne Rouge, etc.)",
    category: "Community",
    date: "2026-05-13",
    url: "/",
  },
  {
    id: "laura-roundup",
    title: "Laura's weekly roundup engine — Claude-generated, cached weekly in Blob",
    category: "Content",
    date: "2026-05-13",
  },
  {
    id: "homepage-restructure",
    title: "Homepage restructure — The Club is now the front page; /rides + /about created",
    category: "Platform",
    date: "2026-05-13",
    url: "/",
  },
  {
    id: "neon-db",
    title: "Postgres database (Neon) + Drizzle ORM + Auth.js database sessions",
    category: "Platform",
    date: "2026-05-12",
  },
  {
    id: "google-signin",
    title: "Google sign-in (Auth.js v5) — user accounts foundation",
    category: "Platform",
    date: "2026-05-12",
    url: "/signin",
  },
  {
    id: "bikereg-json-ld",
    title: "BikeReg JSON-LD integration — live event dates + rescheduled badges on /events",
    category: "Content",
    date: "2026-05-12",
    url: "/events",
  },
  {
    id: "laura-voice-id",
    title: "Laura's ElevenLabs voice ID updated to uYXf8XasLslADfZ2MB4u",
    category: "Ops",
    date: "2026-05-12",
  },
  {
    id: "editorial-heroes",
    title: "Editorial hero pattern across all pages — flat photo + soft shadow, gradients removed",
    category: "Platform",
    date: "2026-05-11",
  },
  {
    id: "strava-club-bio",
    title: "Strava club description updated to 2026 brand voice",
    category: "Community",
    date: "2026-05-08",
  },
  {
    id: "claude-design-pdf",
    title: "Claude Design Use Cases — branded PDF reference (10 pages)",
    category: "Ops",
    date: "2026-05-08",
  },
  {
    id: "hero-gradient-removed",
    title: "Hero photos — bottom gradient fade removed for cleaner cuts",
    category: "Platform",
    date: "2026-05-08",
  },
  {
    id: "brand-page",
    title: "/brand — public brand book, rendered live from the codebase",
    category: "Platform",
    date: "2026-05-07",
    url: "/brand",
  },
  {
    id: "logs-date-strip",
    title: "Laura's Logs — strip leading date markers from blog entries",
    category: "Content",
    date: "2026-05-04",
  },
  {
    id: "dashboard",
    title: "/admin/dashboard — Mission Control for ops + planning",
    category: "Ops",
    date: "2026-05-04",
    url: "/admin/dashboard",
  },
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
