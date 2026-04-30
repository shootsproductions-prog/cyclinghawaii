// ──────────────────────────────────────────────────────────────────
//  Cycling Hawaii Store — Printful-backed catalog
// ──────────────────────────────────────────────────────────────────
//
//  HOW THE STORE WORKS NOW
//
//  Products live in Printful (https://www.printful.com/dashboard).
//  This file fetches them via the Printful API and adapts them into
//  the shape /store + /store/[slug] expects.
//
//  TO ADD A NEW PRODUCT
//  1. Design it in Printful's interface (mockups, files, retail price)
//  2. Save it as a sync product
//  3. Push the site (or wait up to 1h ISR) — it appears on /store
//
//  TO TWEAK COPY OR HIDE A PRODUCT
//  See the OVERRIDES map below. Keys are the auto-generated slug
//  (lowercase, dashes). You can override description, badge, status,
//  isExclusive, etc. without touching Printful.
//
//  TO ENABLE SELLING
//  Set buyUrl in OVERRIDES (or wait for the Stripe + Printful order
//  webhook integration in Phase 2). Until then, all products show
//  "Coming Soon" by default.
// ──────────────────────────────────────────────────────────────────

import { cache } from "react";
import {
  fetchSyncProducts,
  fetchSyncProduct,
  type PrintfulSyncVariant,
} from "./printful";

export type ProductCategory = "Sticker" | "Apparel" | "Headwear" | "Other";
export type ProductStatus =
  | "published"
  | "coming_soon"
  | "sold_out"
  | "draft";

export interface StoreProduct {
  slug: string;
  printfulProductId: number;
  name: string;
  category: ProductCategory;
  priceUSD: number;
  shortDescription?: string;
  description: string;
  /** First entry is the primary image. */
  images: string[];
  buyUrl?: string;
  status: ProductStatus;
  badge?: string;
  isExclusive?: boolean;
}

// ─── Per-product overrides ────────────────────────────────────────
// Add entries here to customize how Printful products render on the
// site. Keys are slugs (auto-generated from product name).
//
// Example:
//   "cycling-hawaii-trucker-hat": {
//     shortDescription: "Custom one-liner",
//     badge: "New",
//     isExclusive: false,
//     status: "published",
//     buyUrl: "https://buy.stripe.com/...",
//   },
const OVERRIDES: Record<string, Partial<StoreProduct>> = {};

// ─── Helpers ──────────────────────────────────────────────────────

function slugify(name: string): string {
  return name
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function categorizeProduct(name: string): ProductCategory {
  const n = name.toLowerCase();
  if (/sticker|decal/.test(n)) return "Sticker";
  if (/hat|cap|beanie|trucker|snapback|bucket/.test(n)) return "Headwear";
  if (/shirt|tee|t-?shirt|hoodie|sweatshirt|tank|jersey|polo/.test(n))
    return "Apparel";
  return "Other";
}

function pickImagesFromVariants(
  variants: PrintfulSyncVariant[],
  fallbackThumbnail: string
): string[] {
  const images: string[] = [];
  // Prefer mockup preview URLs from variant files (these are the
  // generated mockups Printful renders with the design applied).
  for (const v of variants) {
    for (const f of v.files ?? []) {
      const candidate = f.preview_url ?? f.thumbnail_url;
      if (candidate && !images.includes(candidate)) {
        images.push(candidate);
      }
    }
    // Variant-level product image as a secondary source.
    if (v.product?.image && !images.includes(v.product.image)) {
      images.push(v.product.image);
    }
  }
  if (images.length === 0 && fallbackThumbnail) {
    images.push(fallbackThumbnail);
  }
  return images;
}

function defaultShortDescription(category: ProductCategory): string {
  switch (category) {
    case "Sticker":
      return "Vinyl die-cut. Weather-proof. Goes anywhere.";
    case "Apparel":
      return "Soft, well-cut, made to ride in.";
    case "Headwear":
      return "Embroidered. Trade-wind ready.";
    default:
      return "Cycling Hawaiʻi.";
  }
}

function defaultDescription(name: string): string {
  return `${name}. Designed by Cycling Hawaiʻi, printed on demand by Printful, shipped worldwide.`;
}

// ─── Public API ───────────────────────────────────────────────────

export const getProducts = cache(async (): Promise<StoreProduct[]> => {
  const summaries = await fetchSyncProducts();
  if (summaries.length === 0) return [];

  // Fetch each product's variants in parallel for prices + images
  const detailed = await Promise.all(
    summaries.map(async (sp) => {
      const detail = await fetchSyncProduct(sp.id);
      return detail
        ? { summary: sp, variants: detail.variants }
        : { summary: sp, variants: [] };
    })
  );

  const products: StoreProduct[] = [];
  for (const d of detailed) {
    const { summary: sp, variants } = d;
    const slug = slugify(sp.name);
    const category = categorizeProduct(sp.name);
    const priceStr = variants[0]?.retail_price ?? "0";
    const priceUSD = parseFloat(priceStr) || 0;
    const images = pickImagesFromVariants(variants, sp.thumbnail_url);

    const base: StoreProduct = {
      slug,
      printfulProductId: sp.id,
      name: sp.name,
      category,
      priceUSD,
      shortDescription: defaultShortDescription(category),
      description: defaultDescription(sp.name),
      images,
      // Default to coming_soon until Stripe payment wiring is in.
      status: "coming_soon",
      isExclusive: false,
    };

    products.push({ ...base, ...OVERRIDES[slug] });
  }

  // Order: Stickers, Apparel, Headwear, Other
  const order: ProductCategory[] = [
    "Sticker",
    "Apparel",
    "Headwear",
    "Other",
  ];
  products.sort((a, b) => {
    const ai = order.indexOf(a.category);
    const bi = order.indexOf(b.category);
    if (ai !== bi) return ai - bi;
    return a.name.localeCompare(b.name);
  });

  return products;
});

export async function getProduct(
  slug: string
): Promise<StoreProduct | undefined> {
  const all = await getProducts();
  return all.find((p) => p.slug === slug);
}

export async function getPublishedProducts(): Promise<StoreProduct[]> {
  const all = await getProducts();
  return all.filter((p) => p.status !== "draft");
}

export async function getProductsByCategory(
  category: ProductCategory
): Promise<StoreProduct[]> {
  const all = await getPublishedProducts();
  return all.filter((p) => p.category === category);
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

export async function getGroupedProducts(): Promise<
  { category: ProductCategory; label: string; products: StoreProduct[] }[]
> {
  const published = await getPublishedProducts();
  return CATEGORY_ORDER.map((category) => ({
    category,
    label: CATEGORY_LABEL[category],
    products: published.filter((p) => p.category === category),
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
