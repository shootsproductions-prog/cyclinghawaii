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
    slug: "cycle-to-the-sun-2026",
    title: "Cycle to the Sun",
    date: "2026-08-01",
    island: "Maui",
    location: "Pāʻia → Haleakalā Summit, Maui",
    type: "Race",
    distances: "36 mi · 10,023 ft · sea level to summit",
    shortDescription:
      "Hawaiʻi's premier cycling event. Sea level to 10,023 ft up the volcano in 36 miles. Gradients to 18%. One of the hardest single climbs on the planet.",
    description:
      "The legendary Cycle to the Sun is one of the most difficult bike climbs in the world. Riders start at sea level in Pāʻia and finish at the summit of Haleakalā — 10,023 feet of climbing over 36 miles, with gradients reaching 18%. The race is capped at 200 participants and contingent on National Park Service approval. A three-person relay option is available with changeover points at approximately 2,700 ft and 6,500 ft.\n\nEntry fees benefit the Pāʻia Youth Center. Online registration only via Bikereg.",
    registrationUrl: "https://www.bikereg.com/cycle-to-the-sun",
    websiteUrl: "https://cycletothesun.com/",
    organizer: "Go Cycling Maui",
    cost: "$250 ($225 kamaʻāina) · Relay: $400 ($375 kamaʻāina)",
    coverPhoto: "/events/cycle-to-the-sun.jpg",
    isFundraiser: true,
    hashtag: "#cycletothesun",
    lauraTake:
      "Sea level to 10,023 feet. Gradients to 18%. Three hours of climbing for the average mortal. This is the climb that decides who you are as a cyclist. 200-rider cap, so register early. Proceeds go to the Pāʻia Youth Center, which means even your suffering is a donation.",
    schedule: [
      {
        date: "2026-08-01",
        time: "6:30 AM",
        title: "Mass Start",
        location: "Pāʻia bypass road, Maui",
      },
    ],
  },
  {
    slug: "dick-evans-memorial-2026",
    title: "Dick Evans Memorial Road Race",
    date: "2026-08-30",
    island: "Oahu",
    location: "Honolulu, Oahu",
    type: "Race",
    distances: "112 mi",
    shortDescription:
      "The pinnacle of Hawaiʻi bike racing. 112 miles around Oʻahu — the same distance that became the Iron Man bike leg.",
    description:
      "The Dick Evans Memorial Road Race is the longest-running and most prestigious road race in Hawaiʻi. The 112-mile course around Oʻahu is the basis for the Iron Man Triathlon's bike leg. It's a serious day on the bike — for racers, for sufferers, for anyone who wants to ride into the history of the sport here.",
    registrationUrl: "https://www.bikereg.com/73691",
    organizer: "Hawaiʻi cycling community",
    cost: "See registration",
    coverPhoto: "/events/dick-evans.jpg",
    hashtag: "#dickevans",
    lauraTake:
      "112 miles around Oʻahu. The course that gave the Iron Man its bike distance. Show up with the legs you've got — and the willingness to use all of them. There's no honor in finishing a race you can fake; this isn't one of those races.",
  },
  {
    slug: "honolulu-century-2026",
    title: "Honolulu Century Ride",
    date: "2026-09-27",
    island: "Oahu",
    location: "Kapiʻolani Park, Honolulu",
    type: "Charity",
    distances: "25 / 50 / 75 / 100 mi",
    shortDescription:
      "Hawaiʻi's largest cycling event. Out-and-back along Oʻahu's South Shore and Windward Coast. Pick your distance.",
    description:
      "The Honolulu Century Ride is Hawaiʻi's largest cycling event and the Hawaiʻi Bicycling League's biggest fundraiser. Riders start at Kapiʻolani Park at 6:15 AM, head past Diamond Head just after sunrise, out to Sandy Beach, through the backroads of Waimānalo, through Kailua and Kāneʻohe, with the 100-mile turnaround at Swanzy Beach Park.\n\nThe route is mostly flat with moderate hills and a prevailing east or northeast wind of 5-15 mph. Four distance options (25 / 50 / 75 / 100 mi) make it accessible to all riders. An optional shuttle return from Swanzy lets you experience the full course in 50 miles.",
    registrationUrl: "https://hbl.redpodium.com/hcr26",
    websiteUrl: "https://hbl.org/hcr/",
    organizer: "Hawaiʻi Bicycling League (HBL)",
    organizerUrl: "https://hbl.org/",
    cost: "HBL Members from $80 · General from $110 · International from $150 · Youth from $40",
    coverPhoto: "/events/honolulu-century.jpg",
    isFundraiser: true,
    hashtag: "#honolulucentury",
    lauraTake:
      "Hawaiʻi's biggest ride day. Pick your distance: 25, 50, 75, or 100. Flat-ish with that famous Oʻahu trade wind doing whatever it wants. HBL puts it on, which means it's well-organized, the rest stops are real, and your money supports cycling advocacy across the islands.",
    schedule: [
      {
        date: "2026-09-25",
        time: "12:00-6:00 PM",
        title: "Packet Pickup",
        location: "Ala Wai Golf Course Clubhouse, 404 Kapahulu Ave., Honolulu",
      },
      {
        date: "2026-09-26",
        time: "10:00 AM-4:00 PM",
        title: "Packet Pickup",
        location: "Ala Wai Golf Course Clubhouse, 404 Kapahulu Ave., Honolulu",
      },
      {
        date: "2026-09-27",
        time: "6:15 AM",
        title: "Mass Start",
        location: "Kapiʻolani Park, Honolulu",
        description:
          "All distances depart together; choose your own turnaround.",
      },
    ],
  },
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
  {
    slug: "pedal-imua-2026",
    title: "Pedal IMUA",
    date: "2026-12-05",
    island: "Maui",
    location: "West Maui Mountain Loop",
    type: "Charity",
    distances: "30 / 60 mi · 4,173 ft",
    shortDescription:
      "The annual Maui charity ride. 60 miles around the West Maui Mountains — a loop Bicycling Magazine called one of the 10 best in the world.",
    description:
      "Pedal IMUA is Maui's beloved annual charity ride. The full 100km (60 mi) Gran Fondo follows the West Maui Mountain Loop — a route Bicycling Magazine named one of the top 10 bike rides in the world. A 30-mile half option is available. The course starts and ends at sea level with 4,173 ft of climbing along the way.\n\nE-bikes are welcomed. Hydration and rest stops are sponsored throughout. After finishing, riders are greeted by children from Imua programs with traditional flower lei, and a complimentary brunch awaits. Out-of-state supporters can participate remotely.\n\nProceeds benefit Dream IMUA, a wish-granting program supporting children in Maui County experiencing crisis from abuse and trauma.",
    registrationUrl: "https://discoverimua.com/pedal/",
    websiteUrl: "https://discoverimua.com/pedal/",
    organizer: "Imua Family Services",
    organizerUrl: "https://discoverimua.com/",
    cost: "See registration",
    coverPhoto: "/events/pedal-imua.jpg",
    isFundraiser: true,
    hashtag: "#pedalimua",
    lauraTake:
      "The Maui ride that always feels like home. 60 miles around the West Maui Mountains — Bicycling Magazine put it on the world's top-10 list and they were right. Charity proceeds go to Dream IMUA. Finishers get a lei from the kids. Brunch after. E-bikes welcomed. Note the date and start training.",
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
