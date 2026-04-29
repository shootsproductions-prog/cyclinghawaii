// Hawaii cycling events directory.
// Events are co-edited here. When the catalog grows, this can graduate
// to a CMS/blob-backed admin — for now, the file is the source of truth.

export interface EventScheduleItem {
  /** ISO date YYYY-MM-DD. Used for sort order. */
  date: string;
  /** Optional time string e.g. "8:30 AM" or "3:00-5:00 PM" */
  time?: string;
  title: string;
  location?: string;
  description?: string;
}

export type EventIsland =
  | "Maui"
  | "Oahu"
  | "Big Island"
  | "Kauai"
  | "Lanai"
  | "Molokai";

export type EventType =
  | "Gravel"
  | "Road"
  | "MTB"
  | "Charity"
  | "Group Ride"
  | "Race"
  | "Mixed";

export interface CyclingEvent {
  slug: string;
  title: string;
  /** Primary date — used for sorting + countdown. ISO YYYY-MM-DD. */
  date: string;
  /** Optional end date for multi-day events. */
  endDate?: string;
  /** Year only (computed if needed for archive grouping). */
  island: EventIsland;
  location: string;
  type: EventType;
  /** Display-friendly distance/format description */
  distances: string;
  /** Long-form description (used on detail page). */
  description: string;
  /** Short version used on listing cards (1-2 sentences). */
  shortDescription?: string;
  registrationUrl?: string;
  websiteUrl?: string;
  /** Optional Strava route URL (we display a polyline preview) */
  routeUrl?: string;
  organizer?: string;
  organizerUrl?: string;
  cost?: string;
  /** Path under /public, e.g. "/events/aloha-gravel.jpg" */
  coverPhoto?: string;
  lauraTake?: string;
  schedule?: EventScheduleItem[];
  isFundraiser?: boolean;
  isFeatured?: boolean;
  /** Hashtag for riders to use, optional */
  hashtag?: string;
}

export const EVENTS: CyclingEvent[] = [
  {
    slug: "aloha-gravel-2026",
    title: "Aloha Gravel",
    date: "2026-11-07",
    island: "Maui",
    location: "Lahaina, Maui",
    type: "Gravel",
    distances: "9-11 mi loops · 7 hours · ride as many as you want",
    shortDescription:
      "Lap-based gravel. No podiums. No categories. A 9-mile loop you can ride as many times as your legs and pride allow. It's a fundraiser — every lap counts twice.",
    description:
      "Aloha Gravel is a unique cycling experience blending challenging routes, scenic backroads, and laid-back island-style hospitality. Whether you're a seasoned racer or just in it for the good times, there's a course for you. Ride hard, smile big, and be part of a growing gravel 'ohana.\n\nThis event is designed with community and positive vibes at the core. No podiums, no categories. Since the event is in the off-season and you're riding one of the most beautiful places on the planet, riders go as fast or slow as they want. The course is a 9-11 mile loop — an epic gravel climb up, flowing singletrack down. Riders complete as many laps as they can in a 7-hour period. Finishers receive a patch with the number of laps completed.",
    registrationUrl: "https://www.movemint.cc/events/aloha_gravel_2026",
    websiteUrl: "https://www.alohagravel.com/",
    routeUrl: "https://www.strava.com/routes/3413968148150265980",
    organizer: "Maui Sunriders",
    coverPhoto: "/events/aloha-gravel.jpg",
    isFundraiser: true,
    isFeatured: true,
    hashtag: "#alohagravel",
    lauraTake:
      "Lap-based gravel, no podiums, no excuses. A 9-mile loop you can ride as many times as your legs and pride allow. It's a fundraiser, which means even the suffering is for a good cause. Pack snacks. Show up. Smile. The Sunriders close the day with an ʻohana party.",
    schedule: [
      {
        date: "2026-11-04",
        time: "10:00 AM",
        title: "Course Marking Party / Group Ride",
        location: "Maui Sunriders, Kapalua · 800 Office Rd, Lahaina",
        description:
          "Slowly ride the entire course, clean any fallen limbs, mark the route. Community welcome — answer last-minute questions about the event.",
      },
      {
        date: "2026-11-06",
        time: "3:00-5:00 PM",
        title: "Welcome Party & Check-In",
        location: "Maui Sunriders, Kīhei · 1847 S Kihei Rd",
        description:
          "Pre-event check-in and ʻohana welcome. Get your number, meet the crew, ask any questions.",
      },
      {
        date: "2026-11-07",
        time: "7:00 AM",
        title: "Race Day Check-In",
        location: "Maui Sunriders · 800 Office Rd, Lahaina",
        description: "Final check-in for anyone who didn't make Friday.",
      },
      {
        date: "2026-11-07",
        time: "8:10 AM",
        title: "Required Rider Meeting",
        location: "Maui Sunriders, Lahaina",
      },
      {
        date: "2026-11-07",
        time: "8:30 AM",
        title: "Mass Start",
        location: "Maui Sunriders, Lahaina",
        description: "The Tour begins. Last lap must start by 2:00 PM.",
      },
      {
        date: "2026-11-07",
        time: "3:00 PM",
        title: "Course Close",
        location: "Maui Sunriders, Lahaina",
      },
      {
        date: "2026-11-07",
        time: "3:00-5:00 PM",
        title: "Gravel ʻOhana Party",
        location: "Maui Sunriders, Lahaina",
        description:
          "Wrap up the day with a closing party at the bike shop with the new Gravel ʻOhana. Snacks and drinks provided.",
      },
    ],
  },
];

// ─── Helpers ────────────────────────────────────────────────────────

export function getEvent(slug: string): CyclingEvent | undefined {
  return EVENTS.find((e) => e.slug === slug);
}

export function getUpcomingEvents(today: Date = new Date()): CyclingEvent[] {
  const todayISO = today.toISOString().slice(0, 10);
  return EVENTS.filter((e) => (e.endDate ?? e.date) >= todayISO).sort(
    (a, b) => a.date.localeCompare(b.date)
  );
}

export function getPastEvents(today: Date = new Date()): CyclingEvent[] {
  const todayISO = today.toISOString().slice(0, 10);
  return EVENTS.filter((e) => (e.endDate ?? e.date) < todayISO).sort(
    (a, b) => b.date.localeCompare(a.date)
  );
}

export function getFeaturedEvent(today: Date = new Date()): CyclingEvent | undefined {
  const upcoming = getUpcomingEvents(today);
  return upcoming.find((e) => e.isFeatured) ?? upcoming[0];
}

/** Days remaining (negative if past). */
export function daysUntil(dateISO: string, today: Date = new Date()): number {
  const target = new Date(dateISO + "T00:00:00");
  const ms = target.getTime() - today.getTime();
  return Math.floor(ms / (1000 * 60 * 60 * 24));
}

export function formatEventDate(start: string, end?: string): string {
  const s = new Date(start + "T00:00:00");
  if (end && end !== start) {
    const e = new Date(end + "T00:00:00");
    const sameMonth = s.getMonth() === e.getMonth();
    const startStr = s.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
    });
    const endStr = sameMonth
      ? e.toLocaleDateString("en-US", { day: "numeric" })
      : e.toLocaleDateString("en-US", { month: "short", day: "numeric" });
    return `${startStr}-${endStr}, ${e.getFullYear()}`;
  }
  return s.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

export function eventTypeColor(type: EventType): { bg: string; text: string } {
  switch (type) {
    case "Gravel":
      return { bg: "bg-[#b45309]/15", text: "text-[#b45309]" };
    case "MTB":
      return { bg: "bg-[#059669]/15", text: "text-[#059669]" };
    case "Road":
      return { bg: "bg-strava/15", text: "text-strava" };
    case "Charity":
      return { bg: "bg-[#a855f7]/15", text: "text-[#a855f7]" };
    case "Race":
      return { bg: "bg-[#dc2626]/15", text: "text-[#dc2626]" };
    case "Group Ride":
      return { bg: "bg-[#0ea5e9]/15", text: "text-[#0ea5e9]" };
    default:
      return { bg: "bg-mist/15", text: "text-mist" };
  }
}
