// ──────────────────────────────────────────────────────────────────
//  Cycling Hawaii Store — product catalog.
// ──────────────────────────────────────────────────────────────────
//
//  HOW TO ADD A NEW PRODUCT
//
//  1. Drop the photo(s) at  /public/store/[slug]/main.jpg
//                           /public/store/[slug]/2.jpg  (optional extras)
//
//  2. Add an entry to the PRODUCTS array below. Most fields are
//     self-explanatory. The slug must be URL-safe (lowercase, dashes).
//
//  3. Set status to "published" when ready to sell.
//     Use "coming_soon" while you're still designing.
//     Use "sold_out" to keep it visible but disabled.
//     Use "draft" to hide it entirely.
//
//  4. Set buyUrl to a Stripe Payment Link (or Printful URL, etc.) when
//     payments are wired. Leave undefined to show "Coming Soon".
//
//  5. Commit + push. Vercel rebuilds. Live within ~1 minute.
//
//  Same workflow as /events. No CMS needed for this scale.
// ──────────────────────────────────────────────────────────────────

export type ProductCategory = "Sticker" | "Apparel" | "Headwear" | "Other";
export type ProductStatus =
  | "published"
  | "coming_soon"
  | "sold_out"
  | "draft";

export interface StoreProduct {
  slug: string;
  name: string;
  category: ProductCategory;
  priceUSD: number; // e.g. 5 → "$5"
  shortDescription?: string; // 1 line for cards
  description: string; // longer copy for detail page
  /** Image paths under /public, first is primary. */
  images: string[];
  /** Stripe Payment Link, Printful URL, etc. — leave empty until live. */
  buyUrl?: string;
  status: ProductStatus;
  /** Optional pill, e.g. "New", "Limited", "Drop 1". */
  badge?: string;
  /** True = visible only to active members of The Twelve. */
  isExclusive?: boolean;
}

// ─── Catalog ───────────────────────────────────────────────────────

export const PRODUCTS: StoreProduct[] = [
  // ── Stickers ────────────────────────────────────────────────
  {
    slug: "cycling-hawaii-logo-sticker",
    name: "Cycling Hawaiʻi Logo Sticker",
    category: "Sticker",
    priceUSD: 5,
    shortDescription:
      "The orange scarab. Vinyl die-cut, weather-proof, goes anywhere.",
    description:
      "The Cycling Hawaiʻi logo in orange scarab form. 3-inch vinyl die-cut sticker, weather-proof. Goes on bike frames, water bottles, helmets, laptops, anywhere worth marking.",
    images: ["/store/cycling-hawaii-logo-sticker/main.jpg"],
    status: "coming_soon",
  },
  {
    slug: "cyclinghawaii-com-sticker",
    name: "cyclinghawaii.com Sticker",
    category: "Sticker",
    priceUSD: 5,
    shortDescription: "Just the URL. Type-only. Subtle. Earned.",
    description:
      "Just the URL: cyclinghawaii.com. Type-only sticker for understated representation. Vinyl, 3-inch wide, weather-proof.",
    images: ["/store/cyclinghawaii-com-sticker/main.jpg"],
    status: "coming_soon",
  },
  {
    slug: "at-cyclinghawaii-sticker",
    name: "@cyclinghawaii Sticker",
    category: "Sticker",
    priceUSD: 5,
    shortDescription: "The handle. Black sticker, orange wordmark.",
    description:
      "@cyclinghawaii — for the IG-coded among us. Black vinyl sticker, orange wordmark. 3-inch wide. Weather-proof, frame-safe.",
    images: ["/store/at-cyclinghawaii-sticker/main.jpg"],
    status: "coming_soon",
  },

  // ── Apparel ────────────────────────────────────────────────
  {
    slug: "just-ride-tee",
    name: "Just Ride Tee",
    category: "Apparel",
    priceUSD: 32,
    shortDescription: 'Soft tri-blend. "Just Ride." across the back.',
    description:
      'Soft tri-blend tee. Cycling Hawaiʻi pocket-print on the front, "Just Ride." wordmark across the back shoulders. Available in heather gray.',
    images: ["/store/just-ride-tee/main.jpg"],
    status: "coming_soon",
  },

  // ── Headwear ───────────────────────────────────────────────
  {
    slug: "cycling-hawaii-trucker-hat",
    name: "Cycling Hawaiʻi Trucker Hat",
    category: "Headwear",
    priceUSD: 30,
    shortDescription:
      "Classic 5-panel. Embroidered wordmark. Mesh back. Trade-wind ready.",
    description:
      "Classic 5-panel trucker hat. Cycling Hawaiʻi wordmark embroidered on the front in strava-orange. Structured front panel, mesh back, snapback adjustable.",
    images: ["/store/cycling-hawaii-trucker-hat/main.jpg"],
    status: "coming_soon",
  },
  {
    slug: "cycling-hawaii-beanie",
    name: "Cycling Hawaiʻi Beanie",
    category: "Headwear",
    priceUSD: 25,
    shortDescription:
      "Knit beanie. Embroidered logo. For upcountry rides and cool mornings.",
    description:
      "Knit beanie for upcountry rides and chilly mornings. Cycling Hawaiʻi logo embroidered on the cuff. One size fits most.",
    images: ["/store/cycling-hawaii-beanie/main.jpg"],
    status: "coming_soon",
  },
];

// ─── Helpers ───────────────────────────────────────────────────────

export function getProduct(slug: string): StoreProduct | undefined {
  return PRODUCTS.find((p) => p.slug === slug);
}

export function getPublishedProducts(): StoreProduct[] {
  // "draft" is hidden; everything else (published / coming_soon /
  // sold_out) is visible on the page in its own state.
  return PRODUCTS.filter((p) => p.status !== "draft");
}

export function getProductsByCategory(
  category: ProductCategory
): StoreProduct[] {
  return getPublishedProducts().filter((p) => p.category === category);
}

const CATEGORY_ORDER: ProductCategory[] = [
  "Sticker",
  "Apparel",
  "Headwear",
  "Other",
];

const CATEGORY_LABEL: Record<ProductCategory, string> = {
  Sticker: "Stickers",
  Apparel: "Apparel",
  Headwear: "Headwear",
  Other: "Other",
};

export function getGroupedProducts(): {
  category: ProductCategory;
  label: string;
  products: StoreProduct[];
}[] {
  return CATEGORY_ORDER.map((category) => ({
    category,
    label: CATEGORY_LABEL[category],
    products: getProductsByCategory(category),
  })).filter((group) => group.products.length > 0);
}

export function formatPrice(priceUSD: number): string {
  return `$${priceUSD.toFixed(priceUSD % 1 === 0 ? 0 : 2)}`;
}

export function statusLabel(status: ProductStatus): string {
  switch (status) {
    case "coming_soon":
      return "Coming Soon";
    case "sold_out":
      return "Sold Out";
    case "published":
      return "Available";
    case "draft":
      return "Draft";
  }
}
