// The 12 stages of Tour de Maui.
// One stage per month, year-round. Riders complete in any order.
// When Vini builds proper Tour routes in Strava, swap routeId values here.

export type StageType =
  | "Sprint"
  | "Punchy Classic"
  | "Breakaway"
  | "Time Trial"
  | "Lanai Gravel"
  | "Marathon"
  | "First Mountain"
  | "Queen Stage"
  | "Mountain TT"
  | "Hors Catégorie"
  | "Coastal Recovery"
  | "Champs-Élysées";

export interface TourStage {
  number: number; // 1-12
  month: number; // 1-12 (calendar month this stage is featured in)
  monthName: string;
  name: string;
  type: StageType;
  description: string;
  /** Strava route ID — placeholder using existing routes until Vini builds proper Tour routes. */
  routeId: string | null;
  routeName?: string; // for display when no route ID yet
  /**
   * Strava segment ID for legitimacy verification. When a tagged ride
   * also contains an effort on this segment, the completion is marked
   * "verified" instead of just "claimed". Optional — stages without a
   * segmentId still accept tag-only completions (claimed status).
   */
  segmentId?: number;
  segmentName?: string; // for display
  /** Approximate distance/elevation (used until route is wired) */
  distanceMi: number;
  elevationFt: number;
  /** Tags that count as a completion of this stage. First entry is canonical. */
  tags: string[];
  /** Visual color accent for this stage card */
  accent: string;
  /** Lanai = the special one (May, gravel, off-island) */
  isSpecial?: boolean;
  /** Hors Catégorie / Queen / etc. */
  isLegendary?: boolean;
}

export const TOUR_STAGES: TourStage[] = [
  {
    number: 1,
    month: 1,
    monthName: "January",
    name: "The Opening Sprint",
    type: "Sprint",
    description:
      "Fresh year, fresh legs. Short, fast, flat. No excuses are accepted.",
    routeId: "25081195",
    routeName: "Stage 1 — Sprint",
    distanceMi: 6.7,
    elevationFt: 115,
    tags: ["#tdm-stage-1", "#opening-sprint"],
    accent: "#0ea5e9",
  },
  {
    number: 2,
    month: 2,
    monthName: "February",
    name: "The Punchy Classic",
    type: "Punchy Classic",
    description:
      "Spring-classic style. Short walls, repeated attacks. Tactical day.",
    routeId: "2777712774171993286",
    routeName: "Launiupoko → Lahainaluna Loop",
    distanceMi: 10.6,
    elevationFt: 1443,
    tags: ["#tdm-stage-2", "#punchy-classic"],
    accent: "#a855f7",
  },
  {
    number: 3,
    month: 3,
    monthName: "March",
    name: "The Breakaway",
    type: "Breakaway",
    description:
      "Rolling terrain that rewards a solo move. Wind matters. So does patience.",
    routeId: null,
    routeName: "Hāʻikū Rolling Loop (TBD)",
    distanceMi: 50,
    elevationFt: 4000,
    tags: ["#tdm-stage-3", "#breakaway"],
    accent: "#10b981",
  },
  {
    number: 4,
    month: 4,
    monthName: "April",
    name: "The Time Trial",
    type: "Time Trial",
    description:
      "Solo against the clock. No drafting, no excuses. Pure power-to-weight.",
    routeId: "2798467826013875228",
    routeName: "Skyline TT",
    distanceMi: 15.7,
    elevationFt: 182,
    tags: ["#tdm-stage-4", "#time-trial"],
    accent: "#f59e0b",
  },
  {
    number: 5,
    month: 5,
    monthName: "May",
    name: "The Lanai Gravel",
    type: "Lanai Gravel",
    description:
      "The off-island stage. Take the ferry. Bring gravel tires. The pineapples are watching.",
    routeId: "2780259238432658514",
    routeName: "Manele → Lanai City",
    distanceMi: 7.8,
    elevationFt: 1729,
    tags: ["#tdm-stage-5", "#lanai-gravel"],
    accent: "#84cc16",
    isSpecial: true,
  },
  {
    number: 6,
    month: 6,
    monthName: "June",
    name: "The Marathon",
    type: "Marathon",
    description:
      "Longest day of the Tour. Endurance over ambition. Pack snacks.",
    routeId: "2768756588416917340",
    routeName: "Upcountry + West Maui Loop",
    distanceMi: 94.1,
    elevationFt: 6626,
    tags: ["#tdm-stage-6", "#marathon"],
    accent: "#ef4444",
  },
  {
    number: 7,
    month: 7,
    monthName: "July",
    name: "The First Mountain",
    type: "First Mountain",
    description:
      "First proper mountain test of the year. Climb finish. The legs remember.",
    routeId: "2763657064091918118",
    routeName: "Olinda",
    distanceMi: 41.8,
    elevationFt: 4924,
    tags: ["#tdm-stage-7", "#first-mountain"],
    accent: "#dc2626",
  },
  {
    number: 8,
    month: 8,
    monthName: "August",
    name: "The Queen Stage",
    type: "Queen Stage",
    description:
      "Summit finish. The Tour's hardest day. Yellow jerseys are won and lost here.",
    routeId: "2763656384611307964",
    routeName: "Ride to the Sun",
    distanceMi: 32.6,
    elevationFt: 9384,
    tags: ["#tdm-stage-8", "#queen-stage"],
    accent: "#fc5200",
    isLegendary: true,
  },
  {
    number: 9,
    month: 9,
    monthName: "September",
    name: "The Mountain TT",
    type: "Mountain TT",
    description:
      "Time trial uphill. Pure power-to-weight. No tactics. Just gravity.",
    routeId: null,
    routeName: "Olinda Climb TT (TBD)",
    distanceMi: 12,
    elevationFt: 4200,
    tags: ["#tdm-stage-9", "#mountain-tt"],
    accent: "#7c3aed",
  },
  {
    number: 10,
    month: 10,
    monthName: "October",
    name: "Hors Catégorie",
    type: "Hors Catégorie",
    description:
      "Beyond category. The biggest single climb of the Tour. Off the charts.",
    routeId: "2763651711947417142",
    routeName: "Kula → Hāna → Pāʻia → Wailuku → Lahaina",
    distanceMi: 123.0,
    elevationFt: 9290,
    tags: ["#tdm-stage-10", "#hors-categorie", "#hc"],
    accent: "#b45309",
    isLegendary: true,
  },
  {
    number: 11,
    month: 11,
    monthName: "November",
    name: "The Coastal Recovery",
    type: "Coastal Recovery",
    description:
      "Easier day. Scenic. Restore the spirit before the year-end finish.",
    routeId: "2747039293924718950",
    routeName: "Honokōhau Bay",
    distanceMi: 30,
    elevationFt: 1560,
    tags: ["#tdm-stage-11", "#coastal-recovery"],
    accent: "#06b6d4",
  },
  {
    number: 12,
    month: 12,
    monthName: "December",
    name: "The Champs-Élysées",
    type: "Champs-Élysées",
    description:
      "Year-end celebration loop. Aloha all around. Yellow jersey gets bragging rights.",
    routeId: "2891836686108848072",
    routeName: "West Maui Loop",
    distanceMi: 59.0,
    elevationFt: 4282,
    tags: ["#tdm-stage-12", "#champs-elysees"],
    accent: "#eab308",
  },
];

export function findStageByActivity(
  activityName: string
): TourStage | null {
  const lower = activityName.toLowerCase();
  for (const stage of TOUR_STAGES) {
    for (const tag of stage.tags) {
      // tags include the # — strip it and lowercase before matching
      const needle = tag.toLowerCase();
      if (lower.includes(needle)) return stage;
    }
  }
  return null;
}

export function currentMonthStage(): TourStage {
  const m = new Date().getMonth() + 1;
  return TOUR_STAGES.find((s) => s.month === m) ?? TOUR_STAGES[0];
}
