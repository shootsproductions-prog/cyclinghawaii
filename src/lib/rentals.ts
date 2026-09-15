// Hawaiʻi bike-rental directory.
//
// Cycling Hawaiʻi is the discovery layer, not the vendor. Every listing
// is editorial — we describe the shop, Laura gives a take, and the "Rent"
// button opens the shop's own website. We don't take payment, don't hold
// inventory, don't handle reservations. That keeps liability at zero and
// keeps the brand honest.
//
// Curation model:
//   - Shops are hand-entered here (this file is the source of truth for
//     Phase 1). No affiliate links, ever. No paid links dressed as
//     editorial.
//   - The optional `featured: true` flag is reserved for a future paid
//     placement tier. On launch it stays off for everyone — we'll switch
//     it on with a public disclosure ("Featured listings are paid; all
//     listings are editorially reviewed") once we're ready to sell.
//   - Every entry carries a `verified` state:
//       "verified"           → Vini has confirmed the shop details.
//       "needs-verification" → in the catalog but details need a fresh
//                              check (price change, phone change, etc.).
//       "placeholder"        → SEED ENTRY. Do not publish without
//                              replacing. The index page renders a
//                              "Coming soon — verifying listings" banner
//                              whenever any placeholder is still present.
//
// PHASE 1 SCOPE — this file ships with 4 clearly-marked placeholders so
// the UI has content to render in preview. Replace each placeholder with
// a real, verified shop before promoting /rentals publicly.

export type RentalIsland =
  | "Maui"
  | "Oʻahu"
  | "Hawaiʻi"
  | "Kauaʻi"
  | "Molokaʻi"
  | "Lānaʻi";

export type BikeType =
  | "road"
  | "gravel"
  | "mountain"
  | "hybrid"
  | "e-bike"
  | "kids"
  | "cargo"
  | "tandem"
  | "beach-cruiser";

export type RentalFeature =
  | "delivery"
  | "reservations-required"
  | "walk-ins-ok"
  | "guided-tours"
  | "self-guided-routes"
  | "helmet-included"
  | "multi-day-discount"
  | "kid-seat-available"
  | "airport-pickup";

export type VerifiedState = "verified" | "needs-verification" | "placeholder";

export interface RentalShop {
  /** Stable URL slug. Do not change once published — breaks inbound links. */
  slug: string;
  name: string;
  island: RentalIsland;
  /** Town / neighborhood, e.g. "Kīhei", "Kailua-Kona", "Kapaʻa". */
  town: string;
  address?: string;
  phone?: string;
  /** Full URL to shop's homepage (where the "Rent" button lands by default). */
  website: string;
  /** Optional deeper link to the shop's rentals page if different from website. */
  bookingUrl?: string;
  /** Types of bike this shop rents. Order isn't significant. */
  bikeTypes: BikeType[];
  /** Starting USD price per day (rough — for filter display, not a quote). */
  priceFromUSD?: number;
  features: RentalFeature[];
  /**
   * Vini's take in Laura's voice — 1-3 sentences. This is the whole point
   * of the directory vs a Yelp list; write something real, not marketing.
   */
  lauraTake?: string;
  /** Path under /public, e.g. "/rentals/west-maui-cycles.jpg". Optional. */
  photo?: string;
  /** Editorial note — free-form, shows on the detail page below Laura's take. */
  notes?: string;
  /** Convenience flag: shop is a good option for Aloha Gravel visitors. */
  alohaGravelReady?: boolean;
  /** Reserved for a future paid-placement tier. Ships false on launch. */
  featured?: boolean;
  verified: VerifiedState;
  /** ISO YYYY-MM-DD of last verification. */
  verifiedDate?: string;
}

// ────────────────────────────────────────────────────────────────
// SEED ENTRIES — 4 PLACEHOLDERS. Replace before promoting /rentals.
//
// When replacing:
//   1. Change slug + name to the real shop.
//   2. Fill address / phone / website / bookingUrl.
//   3. Confirm bikeTypes + priceFromUSD from the shop's own rate card.
//   4. Write a real lauraTake (dry, sarcastic, affectionate — NOT marketing).
//   5. Flip `verified` to "verified" and set `verifiedDate`.
//   6. Add a photo at /public/rentals/<slug>.jpg (optional but recommended).
// ────────────────────────────────────────────────────────────────

export const RENTAL_SHOPS: RentalShop[] = [
  {
    slug: "placeholder-west-maui-shop",
    name: "PLACEHOLDER — West Maui rental shop",
    island: "Maui",
    town: "Lahaina",
    website: "https://example.com/",
    bikeTypes: ["gravel", "road", "e-bike"],
    priceFromUSD: 65,
    features: ["reservations-required", "helmet-included", "multi-day-discount"],
    lauraTake:
      "Replace this placeholder before publishing. Sample voice: a shop we'd send a friend to when the flight lands and the bike bag stays home.",
    notes:
      "PLACEHOLDER. Real shop needed for West Maui — the Aloha Gravel starting-line area on Nov 7.",
    alohaGravelReady: true,
    featured: false,
    verified: "placeholder",
  },
  {
    slug: "placeholder-south-maui-shop",
    name: "PLACEHOLDER — South Maui rental shop",
    island: "Maui",
    town: "Kīhei",
    website: "https://example.com/",
    bikeTypes: ["road", "hybrid", "e-bike", "kids"],
    priceFromUSD: 45,
    features: ["walk-ins-ok", "delivery", "helmet-included"],
    lauraTake:
      "Replace this placeholder before publishing. South Maui is the tourist e-bike belt — pick a shop that treats a two-day rental as seriously as a two-week one.",
    alohaGravelReady: false,
    featured: false,
    verified: "placeholder",
  },
  {
    slug: "placeholder-oahu-shop",
    name: "PLACEHOLDER — Oʻahu rental shop",
    island: "Oʻahu",
    town: "Honolulu",
    website: "https://example.com/",
    bikeTypes: ["road", "hybrid", "beach-cruiser"],
    priceFromUSD: 40,
    features: ["walk-ins-ok", "helmet-included", "airport-pickup"],
    lauraTake:
      "Replace this placeholder before publishing. Oʻahu needs at least one proper road-bike option and one Waikīkī-adjacent walk-in — probably not the same shop.",
    alohaGravelReady: false,
    featured: false,
    verified: "placeholder",
  },
  {
    slug: "placeholder-big-island-shop",
    name: "PLACEHOLDER — Big Island rental shop",
    island: "Hawaiʻi",
    town: "Kailua-Kona",
    website: "https://example.com/",
    bikeTypes: ["road", "gravel", "mountain"],
    priceFromUSD: 55,
    features: ["reservations-required", "guided-tours", "self-guided-routes"],
    lauraTake:
      "Replace this placeholder before publishing. Kona has a real road scene; find the shop that actually knows Queen K and the climb up Hualālai, not just the shop that has bikes in a rack.",
    alohaGravelReady: false,
    featured: false,
    verified: "placeholder",
  },
];

// ────────────────────────────────────────────────────────────────
// Selectors + helpers
// ────────────────────────────────────────────────────────────────

export function getShop(slug: string): RentalShop | undefined {
  return RENTAL_SHOPS.find((s) => s.slug === slug);
}

export function hasAnyPlaceholders(): boolean {
  return RENTAL_SHOPS.some((s) => s.verified === "placeholder");
}

/**
 * True once at least one shop in the catalog is fully verified. Used by
 * the homepage to gate the /rentals promo — no point sending visitors
 * over there while the catalog is still all seed placeholders.
 */
export function hasVerifiedShops(): boolean {
  return RENTAL_SHOPS.some((s) => s.verified === "verified");
}

/**
 * Filter shops by any combination of island / bike type / delivery.
 * Undefined filters mean "any". Empty result is a valid outcome.
 */
export function filterShops(
  shops: RentalShop[],
  opts: {
    island?: RentalIsland;
    bikeType?: BikeType;
    delivery?: boolean;
    alohaGravelReady?: boolean;
  }
): RentalShop[] {
  return shops.filter((s) => {
    if (opts.island && s.island !== opts.island) return false;
    if (opts.bikeType && !s.bikeTypes.includes(opts.bikeType)) return false;
    if (opts.delivery && !s.features.includes("delivery")) return false;
    if (opts.alohaGravelReady && !s.alohaGravelReady) return false;
    return true;
  });
}

/**
 * Sort order for listings: featured first (once we start selling), then
 * verified shops before needs-verification, then placeholders last. Alpha
 * tie-break so the order is deterministic across renders.
 */
export function sortShops(shops: RentalShop[]): RentalShop[] {
  const verifiedRank: Record<VerifiedState, number> = {
    verified: 0,
    "needs-verification": 1,
    placeholder: 2,
  };
  return [...shops].sort((a, b) => {
    // Featured shops always float to the top of their group.
    if (!!a.featured !== !!b.featured) return a.featured ? -1 : 1;
    const va = verifiedRank[a.verified];
    const vb = verifiedRank[b.verified];
    if (va !== vb) return va - vb;
    return a.name.localeCompare(b.name);
  });
}

// ────────────────────────────────────────────────────────────────
// Display helpers — human-readable labels
// ────────────────────────────────────────────────────────────────

export const BIKE_TYPE_LABEL: Record<BikeType, string> = {
  road: "Road",
  gravel: "Gravel",
  mountain: "Mountain",
  hybrid: "Hybrid",
  "e-bike": "E-bike",
  kids: "Kids",
  cargo: "Cargo",
  tandem: "Tandem",
  "beach-cruiser": "Beach cruiser",
};

export const FEATURE_LABEL: Record<RentalFeature, string> = {
  delivery: "Delivery",
  "reservations-required": "Reservations required",
  "walk-ins-ok": "Walk-ins OK",
  "guided-tours": "Guided tours",
  "self-guided-routes": "Self-guided route packages",
  "helmet-included": "Helmet included",
  "multi-day-discount": "Multi-day discount",
  "kid-seat-available": "Kid seat available",
  "airport-pickup": "Airport pickup",
};

export const ISLANDS: RentalIsland[] = [
  "Maui",
  "Oʻahu",
  "Hawaiʻi",
  "Kauaʻi",
  "Molokaʻi",
  "Lānaʻi",
];

export const BIKE_TYPES_IN_UI_ORDER: BikeType[] = [
  "road",
  "gravel",
  "mountain",
  "hybrid",
  "e-bike",
  "beach-cruiser",
  "kids",
  "cargo",
  "tandem",
];

/** Islands that actually have at least one shop in the catalog. */
export function activeIslands(shops: RentalShop[]): RentalIsland[] {
  const set = new Set<RentalIsland>();
  for (const s of shops) set.add(s.island);
  return ISLANDS.filter((i) => set.has(i));
}
