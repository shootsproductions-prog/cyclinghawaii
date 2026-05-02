// ──────────────────────────────────────────────────────────────────
//  Cycling Hawaii — Laura's Gear (curated, no affiliate links)
// ──────────────────────────────────────────────────────────────────
//
//  Editorial-only gear recommendations. Direct links to brand sites,
//  no commission, no affiliates. The trust layer that monetization
//  layers on top of (someday — see strategy doc in Notion / chat
//  history).
//
//  HOW TO ADD OR EDIT GEAR
//
//  1. Drop optional photo at  /public/gear/[slug].jpg
//  2. Add an entry to GEAR below
//  3. Set status: "published" when ready to show
//  4. Set status: "draft" to hide while drafting
//
//  Pricing tier instead of exact dollars (less stale over time):
//    $    : entry-level / commodity
//    $$   : mid
//    $$$  : premium
//    $$$$ : pro / luxury
// ──────────────────────────────────────────────────────────────────

export type GearCategory =
  | "Bike"
  | "Kit"
  | "Tech"
  | "Hawaii"
  | "Don't Ride";

export type GearStatus = "published" | "draft";
export type PriceTier = 1 | 2 | 3 | 4;

export interface GearItem {
  slug: string;
  name: string;
  brand?: string;
  model?: string;
  category: GearCategory;
  /** One-sentence headline (appears on the card). */
  tagline: string;
  /** Laura's longer review (2-5 sentences). */
  review: string;
  /** Optional Maui-specific reasoning. */
  hawaiiAngle?: string;
  priceTier: PriceTier;
  /** Direct link to brand site — no affiliate parameter. */
  url?: string;
  /** Path under /public, e.g. /gear/[slug].jpg */
  image?: string;
  status: GearStatus;
  /** For "Don't Ride" items only. */
  warning?: string;
  /** TBD = Vini hasn't picked the specific product yet. */
  pickTBD?: boolean;
}

export const GEAR: GearItem[] = [
  // ── THE BIKE ─────────────────────────────────────────────
  {
    slug: "trek-checkpoint-sl-7",
    name: "Scarab",
    brand: "Trek",
    model: "Checkpoint SL 7 Gen 3",
    category: "Bike",
    tagline: "Two years in. Still right for Maui.",
    review:
      "OCLV carbon frame, SRAM Force AXS 1×12, 40T × 10-44T gearing, Bontrager Aeolus Elite Carbon wheels, Panaracer GravelKing 45mm tubeless tires, SRAM hydraulic disc brakes. Built like a tank, rolls like a dream. Vini named her Scarab. She's taken him up volcanoes, down coastlines, and through rain he probably should have avoided. Never complains. He can't say the same.",
    hawaiiAngle:
      "The 1×12 setup with the 44T cog is a gift on Haleakalā. The 45mm tubeless tires shrug off volcanic dust and sugar-cane road debris in equal measure. Built for exactly this kind of island.",
    priceTier: 4,
    url: "https://www.trekbikes.com/",
    image: "/bike/scarab-hero.jpg",
    status: "published",
  },

  // ── THE KIT ─────────────────────────────────────────────
  {
    slug: "bibs",
    name: "Bibs",
    category: "Kit",
    tagline: "Cheap bibs are a tax you pay every ride.",
    review:
      "The single most important piece of cycling kit. A good pair makes 6 hours feel like 3. A cheap pair makes 30 miles feel like a punishment. Skimp on socks. Skimp on jerseys. Do not skimp on bibs. The chamois has a job, and you'll know within 2 hours whether it's doing it.",
    hawaiiAngle:
      "Hawaii's heat tests bibs harder than any temperate climate. Look for breathable mesh uppers and quick-dry chamois.",
    priceTier: 3,
    status: "published",
    pickTBD: true,
  },
  {
    slug: "helmet",
    name: "Helmet",
    category: "Kit",
    tagline: "The one you actually wear is the one that works.",
    review:
      "Comfort beats grams. The helmet that's a hassle to put on is the helmet you'll forget on the day you'd needed it. Replace after a crash, after sun-baking for 5 years, or when the foam starts to flake. Don't be sentimental about a piece of safety gear.",
    priceTier: 3,
    status: "published",
    pickTBD: true,
  },
  {
    slug: "sunglasses",
    name: "Sunglasses",
    category: "Kit",
    tagline: "Cycling glasses. Not sunglasses.",
    review:
      "The difference matters at 35mph descending. Cycling-specific glasses wrap, sit close to the face, and don't pop off when you sweat through them. Photochromic lenses are worth the upcharge for variable Hawaii light — bright on the climb, shaded under the canopy on the way down.",
    priceTier: 3,
    status: "published",
    pickTBD: true,
  },
  {
    slug: "cycling-shoes",
    name: "Shoes",
    category: "Kit",
    tagline: "Walk to coffee in them. Or don't bother.",
    review:
      "If your cycling shoes can't survive a 20-foot walk into Grandma's, they're not the right shoes. Stiff sole for power, but enough flex in the cleat position that you're not skating across cafe tile. SPD or 3-bolt road — pick your religion, don't switch.",
    priceTier: 3,
    status: "published",
    pickTBD: true,
  },

  // ── THE TECH ────────────────────────────────────────────
  {
    slug: "bike-computer",
    name: "Bike Computer",
    category: "Tech",
    tagline: "GPS. Not your phone.",
    review:
      "Your phone is for emergencies, not navigation. A real computer doesn't die in 3 hours, doesn't catch every text mid-descent, and shows you exactly the data you need without the data you don't. Wahoo or Garmin — both work, the loyalty wars are silly.",
    priceTier: 3,
    status: "published",
    pickTBD: true,
  },
  {
    slug: "lights",
    name: "Lights",
    category: "Tech",
    tagline: "Day and night, front and back. Always.",
    review:
      "Drivers can't help you if they can't see you. Daytime running lights with a flashing pattern are non-negotiable on Hawaii's narrow shoulders. Bontrager Flare RT is the standard for a reason — visible from 1.2 miles in daylight, USB rechargeable, lasts forever.",
    priceTier: 2,
    status: "published",
    pickTBD: true,
  },
  {
    slug: "hydration",
    name: "Hydration",
    category: "Tech",
    tagline: "Two bottles. One liter each. Minimum.",
    review:
      "On Maui you'll go through more water than you think. Two big bidons live on the bike for any ride over 90 minutes. For Haleakalā or anything stretching past 4 hours, add a hydration pack. Sweat rate doubles in this climate — plan for it.",
    priceTier: 2,
    status: "published",
    pickTBD: true,
  },

  // ── HAWAII-SPECIFIC ─────────────────────────────────────
  {
    slug: "sunscreen",
    name: "Sunscreen",
    category: "Hawaii",
    tagline: "Reef-safe. No exceptions.",
    review:
      "Hawaii law bans oxybenzone and octinoxate, and the rest of us have an obvious responsibility too. For cyclists, mineral sunscreen (zinc oxide) is the play — sweats less into the eyes, doesn't sting, doesn't pollute the bay you'll swim in tomorrow. Reapply at every coffee stop. Set a timer.",
    hawaiiAngle:
      "Pacific sun at altitude is brutal. Haleakalā summit gets you 30% closer to the sun in real terms. Cover ears, neck, back of hands.",
    priceTier: 1,
    status: "published",
    pickTBD: true,
  },
  {
    slug: "anti-chafe",
    name: "Anti-Chafe",
    category: "Hawaii",
    tagline: "On hot rides, the chafe finds you. Get there first.",
    review:
      "Chamois cream isn't optional in this climate. The combination of heat, salt sweat, and long climbs is the perfect chafe trifecta. Apply before. Reapply at the halfway coffee stop. Your skin tomorrow will thank you tonight.",
    priceTier: 1,
    status: "published",
    pickTBD: true,
  },
  {
    slug: "cycling-cap",
    name: "Cycling Cap",
    category: "Hawaii",
    tagline: "Under the helmet. Sweat off the brow. Sun off the ears.",
    review:
      "An old-school cotton cycling cap under the helmet does more in Hawaii than it does anywhere else. Soaks the sweat that would otherwise blind you on a descent. Keeps the harshest sun off the back of the neck. $15. Looks good. Worth it.",
    priceTier: 1,
    status: "published",
    pickTBD: true,
  },
];

// ─── Helpers ──────────────────────────────────────────────────────

const CATEGORY_ORDER: GearCategory[] = [
  "Bike",
  "Kit",
  "Tech",
  "Hawaii",
  "Don't Ride",
];

const CATEGORY_LABEL: Record<GearCategory, string> = {
  Bike: "The Bike",
  Kit: "The Kit",
  Tech: "The Tech",
  Hawaii: "Hawaiʻi-Specific",
  "Don't Ride": "What I Don't Ride",
};

const CATEGORY_BLURB: Record<GearCategory, string> = {
  Bike: "The frame everything else hangs on. Pick well, ride forever.",
  Kit: "Soft goods. Cheap pieces become punishments. The right pieces disappear.",
  Tech: "Lights, computers, hydration. The stuff that keeps you safe and oriented.",
  Hawaii:
    "Built for the climate, the sun, the reef. The things you won't find on a Bay Area gear list.",
  "Don't Ride": "The integrity flex. Honest opinions on what doesn't deserve your money.",
};

export function getPublishedGear(): GearItem[] {
  return GEAR.filter((g) => g.status === "published");
}

export function getGroupedGear(): {
  category: GearCategory;
  label: string;
  blurb: string;
  items: GearItem[];
}[] {
  const published = getPublishedGear();
  return CATEGORY_ORDER.map((category) => ({
    category,
    label: CATEGORY_LABEL[category],
    blurb: CATEGORY_BLURB[category],
    items: published.filter((g) => g.category === category),
  })).filter((group) => group.items.length > 0);
}

export function priceTierLabel(tier: PriceTier): string {
  return "$".repeat(tier);
}
