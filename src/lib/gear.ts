// ──────────────────────────────────────────────────────────────────
//  Cycling Hawaii — Laura's Gear (curated, no affiliate links)
// ──────────────────────────────────────────────────────────────────
//
//  Editorial-only gear recommendations. Direct links to brand sites,
//  no commission, no affiliates. The trust layer that monetization
//  layers on top of (someday).
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
  /** TBD = Vini hasn't picked the specific product/model yet. */
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
    slug: "neopro-bibs",
    name: "NeoPro Bibs & Jerseys",
    brand: "NeoPro Cycling",
    category: "Kit",
    tagline: "Custom kit, direct-to-rider. The chamois that disappears.",
    review:
      "NeoPro is the custom-kit company that gets it. Direct-to-consumer pricing, real chamois engineering, designs that don't look like a 1990s sticker bomb. Vini's been wearing their bibs and jerseys long enough to know — when a chamois disappears, you stop talking about it. That's the highest compliment.",
    hawaiiAngle:
      "Hawaiʻi heat exposes weak fabrics fast. NeoPro's mesh uppers and quick-dry materials handle the salt, sun, and 4-hour climbs without surrendering structure.",
    priceTier: 3,
    url: "https://neoprocycling.com/",
    image: "/gear/neopro-bibs.jpg",
    status: "published",
    pickTBD: true, // specific model TBD — Vini to fill in
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
    slug: "shimano-sunglasses",
    name: "Shimano Sunglasses",
    brand: "Shimano",
    category: "Kit",
    tagline: "Cycling glasses from a company that knows cycling.",
    review:
      "Shimano's been making cycling components since 1921 and sunglasses since they figured out riders need both eye protection AND clear vision at 35mph downhill. The frames wrap properly, sit close to the face, and don't pop off when you sweat. Photochromic lenses earn their upcharge in Hawaiʻi.",
    hawaiiAngle:
      "The light here changes a dozen times in one ride — bright on the climb, shaded under the canopy, blinding at the coast. Photochromic lenses adjust without you thinking about it.",
    priceTier: 3,
    url: "https://bike.shimano.com/",
    image: "/gear/shimano-sunglasses.jpg",
    status: "published",
    pickTBD: true,
  },
  {
    slug: "fizik-shoes",
    name: "Fizik Shoes",
    brand: "Fizik",
    category: "Kit",
    tagline: "Italian craft. Walks to the coffee stop without ego.",
    review:
      "Fizik makes shoes the way Italians make shoes — like they know the shape of a foot. Stiff sole for power, micro-adjust BOA dial that holds through the ride, walkable enough that you don't skate across Grandma's tile. They look like cycling shoes, not spaceship shoes. That matters at the coffee stop.",
    priceTier: 4,
    url: "https://www.fizik.com/",
    image: "/gear/fizik-shoes.jpg",
    status: "published",
    pickTBD: true,
  },
  {
    slug: "dakine-gloves",
    name: "Dakine Gloves",
    brand: "Dakine",
    category: "Kit",
    tagline: "Maui-born. Made by people who ride here.",
    review:
      "Dakine started in Hāʻikū, Maui in 1979 making windsurfing gear. Forty-plus years later, they're still based on this island, still making cycling/MTB gloves, still understanding that gear designed for Hawaiʻi conditions is fundamentally different from gear designed for Bend, Oregon. Supporting local matters when local actually rides.",
    hawaiiAngle:
      "Made on Maui. By Mauians. The wear-test is the actual island, not a wind tunnel in Colorado.",
    priceTier: 2,
    url: "https://www.dakine.com/collections/cycling",
    image: "/gear/dakine-gloves.jpg",
    status: "published",
    pickTBD: true,
  },

  // ── THE TECH ────────────────────────────────────────────
  {
    slug: "gps-setup",
    name: "The GPS Setup",
    brand: "Apple Watch Ultra · iPhone 14 Pro · Quad Lock · Cadence",
    category: "Tech",
    tagline: "Watch on the wrist. Phone on the bars. Cadence runs the show.",
    review:
      "Cycling traditionalists hate phones on bars. Vini does it anyway and won't apologize. Apple Watch Ultra handles GPS, heart rate, multi-day battery, and the brutal Hawaiʻi sun without flinching. iPhone 14 Pro mounted via Quad Lock gives a full-screen dashboard, real navigation, music, and Strava live segments. The Cadence app (Elite tier) is the secret sauce — fully customizable screens, every metric you actually want, none you don't. Article incoming on the screen builds.",
    hawaiiAngle:
      "Apple Watch Ultra's water resistance and titanium case were built for exactly this — sweat, salt, sun, ocean spray on the descent into Lahaina. The Ultra's screen stays readable in direct Pacific sun, which Garmins struggle with.",
    priceTier: 4,
    url: "https://cadence.shop/",
    image: "/gear/gps-setup.jpg",
    status: "published",
  },
  {
    slug: "lights",
    name: "Lights",
    category: "Tech",
    tagline: "Day and night, front and back. Always.",
    review:
      "Drivers can't help you if they can't see you. Daytime running lights with a flashing pattern are non-negotiable on Hawaiʻi's narrow shoulders. Bontrager Flare RT is the standard for a reason — visible from 1.2 miles in daylight, USB rechargeable, lasts forever.",
    priceTier: 2,
    status: "published",
    pickTBD: true,
  },
  {
    slug: "nothing-open-ears",
    name: "Nothing Open Ears",
    brand: "Nothing",
    model: "Ear (open)",
    category: "Tech",
    tagline: "Open-ear means you still hear the truck behind you.",
    review:
      "Riding with closed earbuds on Maui's narrow shoulders is a way to get killed. Open-ear / bone-conduction-style headphones let music or podcasts ride along without sealing you off from traffic, wind warnings, or the friend riding alongside you. Nothing's design is honest about being headphones for situational-awareness people.",
    hawaiiAngle:
      "Hawaiʻi roads have minimal shoulders and aggressive vehicle traffic. Hearing what's behind you isn't optional. Open-ear is the only ethical headphone for cycling here.",
    priceTier: 2,
    url: "https://nothing.tech/",
    image: "/gear/nothing-open-ears.jpg",
    status: "published",
  },
  {
    slug: "rhynowalk-bags",
    name: "Rhynowalk Bags",
    brand: "Rhynowalk",
    category: "Tech",
    tagline: "The carry system for long days on the bike.",
    review:
      "Frame bags, top tube bags, saddle bags — Rhynowalk does utility cycling storage well at a price that doesn't require selling a kidney. Waterproof construction, smart compartments, mounting that holds through chunky descents. Not as boutique as Apidura or Restrap, but most riders won't notice the difference and most wallets will.",
    hawaiiAngle:
      "Maui rides easily stretch to 6+ hours. Real food, sunscreen reapplications, a tube and CO₂, a rain jacket for the surprise upcountry shower — all need a place to live that isn't your jersey pockets.",
    priceTier: 2,
    url: "https://www.rhinowalk.com/",
    image: "/gear/rhynowalk-bags.jpg",
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
      "Hawaiʻi law bans oxybenzone and octinoxate, and the rest of us have an obvious responsibility too. For cyclists, mineral sunscreen (zinc oxide) is the play — sweats less into the eyes, doesn't sting, doesn't pollute the bay you'll swim in tomorrow. Reapply at every coffee stop. Set a timer.",
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
      "An old-school cotton cycling cap under the helmet does more in Hawaiʻi than it does anywhere else. Soaks the sweat that would otherwise blind you on a descent. Keeps the harshest sun off the back of the neck. $15. Looks good. Worth it.",
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
  Tech: "GPS, lights, headphones, bags. The stuff that keeps you safe, oriented, and carrying everything you need.",
  Hawaii:
    "Built for the climate, the sun, the reef. Things you won't find on a Bay Area gear list.",
  "Don't Ride":
    "The integrity flex. Honest opinions on what doesn't deserve your money.",
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
