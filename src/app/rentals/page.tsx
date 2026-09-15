import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import {
  RENTAL_SHOPS,
  BIKE_TYPE_LABEL,
  BIKE_TYPES_IN_UI_ORDER,
  ISLANDS,
  activeIslands,
  filterShops,
  sortShops,
  hasAnyPlaceholders,
  type BikeType,
  type RentalIsland,
  type RentalShop,
} from "@/lib/rentals";

export const metadata: Metadata = {
  title: "Bike rentals in Hawaiʻi — Cycling Hawaii",
  description:
    "Every bike rental shop across the Hawaiian islands, in one place. Road, gravel, e-bike, and more. Editorially curated by Vini, narrated by Laura.",
};

// Page is rendered dynamically because the filter state lives in the URL
// (searchParams). Data itself is static — the whole catalog is compiled
// into src/lib/rentals.ts — so this is cheap to render on each request.
// When we move shops to a DB, add a `revalidate` window here.

interface Props {
  searchParams: Promise<{
    island?: string;
    type?: string;
    delivery?: string;
    ag?: string;
  }>;
}

// Narrow raw string params to the typed unions used by filterShops.
function coerceIsland(raw: string | undefined): RentalIsland | undefined {
  if (!raw) return undefined;
  return (ISLANDS as string[]).includes(raw)
    ? (raw as RentalIsland)
    : undefined;
}
function coerceBikeType(raw: string | undefined): BikeType | undefined {
  if (!raw) return undefined;
  return (BIKE_TYPES_IN_UI_ORDER as string[]).includes(raw)
    ? (raw as BikeType)
    : undefined;
}

export default async function RentalsPage({ searchParams }: Props) {
  const params = await searchParams;
  const island = coerceIsland(params.island);
  const bikeType = coerceBikeType(params.type);
  const delivery = params.delivery === "1";
  const alohaGravelReady = params.ag === "1";

  const filtered = sortShops(
    filterShops(RENTAL_SHOPS, {
      island,
      bikeType,
      delivery,
      alohaGravelReady,
    })
  );

  const hasFilter = !!(island || bikeType || delivery || alohaGravelReady);
  const showPlaceholderBanner = hasAnyPlaceholders();
  const islandsInCatalog = activeIslands(RENTAL_SHOPS);

  return (
    <main>
      {showPlaceholderBanner && <PlaceholderBanner />}
      <Hero />
      <AlohaGravelCallout />
      <FilterBar
        current={{ island, bikeType, delivery, alohaGravelReady }}
        islands={islandsInCatalog}
      />
      {filtered.length > 0 ? (
        <ShopGrid shops={filtered} totalShown={filtered.length} totalAll={RENTAL_SHOPS.length} />
      ) : (
        <EmptyResults hasFilter={hasFilter} />
      )}
      <SubmitCTA />
    </main>
  );
}

// ─────────────── Placeholder banner ───────────────
// Renders whenever the catalog still contains any verified: "placeholder"
// entries. Vini clears the placeholders → banner disappears automatically.
function PlaceholderBanner() {
  return (
    <div className="bg-amber-500/10 border-b border-amber-500/30 text-amber-800 text-sm px-6 py-3 text-center">
      <strong className="font-semibold">Coming soon</strong> — this
      directory is being verified. Listings shown as{" "}
      <em className="not-italic font-mono text-xs">PLACEHOLDER</em> are
      seed entries. Real shops publish here as they clear review.
    </div>
  );
}

// ───────────────────── Hero ─────────────────────
function Hero() {
  return (
    <section className="pt-24 md:pt-28 pb-10 md:pb-14 px-6 md:px-10 lg:px-16 bg-bg">
      <div className="max-w-[1280px] mx-auto">
        <div className="max-w-[820px]">
          <div className="text-[0.7rem] md:text-xs font-semibold tracking-[0.3em] uppercase text-strava mb-4">
            The Directory · Bike Rentals
          </div>
          <h1 className="font-[family-name:var(--font-space-grotesk)] text-4xl md:text-6xl lg:text-7xl font-bold tracking-tight text-text leading-[0.95] mb-5">
            Rent a bike.<span className="text-strava"> Anywhere in Hawaiʻi.</span>
          </h1>
          <p className="text-mist text-base md:text-lg leading-relaxed italic max-w-[620px]">
            Every shop worth knowing about, in one place. We don&apos;t take
            your booking — we send you to the shop&apos;s own site to do
            that. We just make sure you find them.
          </p>
        </div>
      </div>
    </section>
  );
}

// ─── Aloha Gravel callout ────────────────────────
// Highlights shops flagged alohaGravelReady = true so Aloha Gravel
// visitors can jump straight to gravel-capable rentals near Lahaina.
// Hidden if no shop in the catalog is flagged (nothing to promote).
function AlohaGravelCallout() {
  const eligible = RENTAL_SHOPS.filter((s) => s.alohaGravelReady);
  if (eligible.length === 0) return null;

  return (
    <section className="px-6 md:px-10 lg:px-16 bg-bg pb-8">
      <div className="max-w-[1280px] mx-auto">
        <Link
          href="/rentals?ag=1"
          className="block bg-strava/8 border border-strava/25 rounded-2xl p-5 md:p-6 hover:bg-strava/12 transition-colors no-underline"
        >
          <div className="flex items-start md:items-center gap-4 flex-col md:flex-row">
            <div className="text-[0.65rem] font-bold uppercase tracking-[0.25em] text-strava shrink-0">
              Aloha Gravel · Nov 7
            </div>
            <div className="flex-1 min-w-0">
              <div className="font-[family-name:var(--font-space-grotesk)] text-base md:text-lg font-bold text-text leading-tight">
                Flying in for Aloha Gravel? Rent a gravel bike on West Maui.
              </div>
              <div className="text-mist text-xs md:text-sm mt-1">
                {eligible.length} shop{eligible.length === 1 ? "" : "s"} ready
                to hand you the right tires. Lahaina + South Maui, close to the start.
              </div>
            </div>
            <span className="text-strava text-sm font-semibold uppercase tracking-wider shrink-0">
              See picks →
            </span>
          </div>
        </Link>
      </div>
    </section>
  );
}

// ─── Filter bar — URL-param based, works without JS ─────
function FilterBar({
  current,
  islands,
}: {
  current: {
    island?: RentalIsland;
    bikeType?: BikeType;
    delivery?: boolean;
    alohaGravelReady?: boolean;
  };
  islands: RentalIsland[];
}) {
  // Build param objects for each pill link. Selecting a pill toggles that
  // filter; other filters stay put.
  const buildHref = (patch: Partial<Record<string, string>>): string => {
    const next: Record<string, string> = {};
    if (current.island) next.island = current.island;
    if (current.bikeType) next.type = current.bikeType;
    if (current.delivery) next.delivery = "1";
    if (current.alohaGravelReady) next.ag = "1";
    Object.assign(next, patch);
    // Drop empty values so the URL is tidy
    for (const k of Object.keys(next)) if (!next[k]) delete next[k];
    const qs = new URLSearchParams(next).toString();
    return qs ? `/rentals?${qs}` : "/rentals";
  };

  return (
    <section className="px-6 md:px-10 lg:px-16 bg-bg pb-8 border-b border-border">
      <div className="max-w-[1280px] mx-auto space-y-4">
        {/* Island row */}
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-[0.65rem] uppercase tracking-widest text-mist mr-1 shrink-0">
            Island
          </span>
          <FilterPill
            label="All"
            active={!current.island}
            href={buildHref({ island: "" })}
          />
          {islands.map((i) => (
            <FilterPill
              key={i}
              label={i}
              active={current.island === i}
              href={buildHref({ island: current.island === i ? "" : i })}
            />
          ))}
        </div>

        {/* Bike type row */}
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-[0.65rem] uppercase tracking-widest text-mist mr-1 shrink-0">
            Bike
          </span>
          <FilterPill
            label="All"
            active={!current.bikeType}
            href={buildHref({ type: "" })}
          />
          {BIKE_TYPES_IN_UI_ORDER.map((t) => (
            <FilterPill
              key={t}
              label={BIKE_TYPE_LABEL[t]}
              active={current.bikeType === t}
              href={buildHref({ type: current.bikeType === t ? "" : t })}
            />
          ))}
        </div>

        {/* Extras row */}
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-[0.65rem] uppercase tracking-widest text-mist mr-1 shrink-0">
            Extras
          </span>
          <FilterPill
            label="Delivers to you"
            active={current.delivery === true}
            href={buildHref({ delivery: current.delivery ? "" : "1" })}
          />
          <FilterPill
            label="Aloha Gravel ready"
            active={current.alohaGravelReady === true}
            href={buildHref({ ag: current.alohaGravelReady ? "" : "1" })}
          />
        </div>
      </div>
    </section>
  );
}

function FilterPill({
  label,
  active,
  href,
}: {
  label: string;
  active: boolean;
  href: string;
}) {
  return (
    <Link
      href={href}
      className={`text-xs font-semibold uppercase tracking-wider px-3 py-1.5 rounded-full transition-colors no-underline ${
        active
          ? "bg-strava text-white"
          : "bg-card border border-border text-mist hover:border-strava hover:text-strava"
      }`}
    >
      {label}
    </Link>
  );
}

// ────────────────── Shop grid ─────────────────────
function ShopGrid({
  shops,
  totalShown,
  totalAll,
}: {
  shops: RentalShop[];
  totalShown: number;
  totalAll: number;
}) {
  return (
    <section className="py-10 px-6 md:px-10 lg:px-16 bg-bg">
      <div className="max-w-[1280px] mx-auto">
        <div className="text-[0.65rem] uppercase tracking-widest text-mist mb-6">
          Showing {totalShown} of {totalAll}
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {shops.map((s) => (
            <ShopCard key={s.slug} shop={s} />
          ))}
        </div>
      </div>
    </section>
  );
}

function ShopCard({ shop }: { shop: RentalShop }) {
  const isPlaceholder = shop.verified === "placeholder";
  return (
    <Link
      href={`/rentals/${shop.slug}`}
      className={`group bg-card border rounded-2xl overflow-hidden shadow-sm hover:shadow-md transition-shadow flex flex-col no-underline ${
        isPlaceholder ? "border-amber-500/40" : "border-border"
      }`}
    >
      <div className="relative aspect-[16/9] bg-surface overflow-hidden">
        {shop.photo ? (
          <Image
            src={shop.photo}
            alt={shop.name}
            fill
            sizes="(min-width: 1024px) 360px, (min-width: 768px) 50vw, 100vw"
            className="object-cover group-hover:scale-[1.03] transition-transform duration-500"
          />
        ) : (
          <div className="w-full h-full bg-gradient-to-br from-strava/15 via-brand/10 to-mist/10 flex items-center justify-center p-5">
            <div className="font-[family-name:var(--font-space-grotesk)] text-lg font-bold text-text/50 text-center leading-tight">
              {shop.name}
            </div>
          </div>
        )}
        <div className="absolute top-3 left-3 flex flex-wrap gap-1.5">
          {shop.featured && (
            <span className="text-[0.6rem] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-strava text-white">
              Featured
            </span>
          )}
          {isPlaceholder && (
            <span className="text-[0.6rem] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-amber-500 text-white">
              Placeholder
            </span>
          )}
          {shop.alohaGravelReady && !isPlaceholder && (
            <span className="text-[0.6rem] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-white text-strava border border-strava/30">
              AG-ready
            </span>
          )}
        </div>
      </div>
      <div className="p-5 flex-1 flex flex-col">
        <div className="text-[0.65rem] uppercase tracking-widest text-mist mb-1">
          {shop.island} · {shop.town}
        </div>
        <h3 className="font-[family-name:var(--font-space-grotesk)] font-bold text-text text-lg leading-tight mb-2">
          {shop.name}
        </h3>
        <div className="flex flex-wrap gap-1.5 mb-3">
          {shop.bikeTypes.slice(0, 4).map((t) => (
            <span
              key={t}
              className="text-[0.6rem] font-semibold uppercase tracking-wider px-2 py-0.5 rounded-full bg-strava/10 text-strava"
            >
              {BIKE_TYPE_LABEL[t]}
            </span>
          ))}
          {shop.bikeTypes.length > 4 && (
            <span className="text-[0.6rem] font-semibold text-mist self-center">
              +{shop.bikeTypes.length - 4} more
            </span>
          )}
        </div>
        {shop.lauraTake && (
          <p className="text-mist text-sm leading-relaxed line-clamp-3 mb-3 italic">
            {shop.lauraTake}
          </p>
        )}
        <div className="mt-auto pt-3 border-t border-border flex items-center justify-between gap-2">
          {shop.priceFromUSD ? (
            <span className="text-xs text-mist">
              From{" "}
              <strong className="text-strava text-sm font-bold">
                ${shop.priceFromUSD}
              </strong>
              /day
            </span>
          ) : (
            <span className="text-xs text-mist italic">Contact for rates</span>
          )}
          <span className="text-strava group-hover:translate-x-1 transition-transform">
            <svg
              width="14"
              height="14"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.5"
              viewBox="0 0 24 24"
            >
              <path d="M14 5l7 7m0 0l-7 7m7-7H3" />
            </svg>
          </span>
        </div>
      </div>
    </Link>
  );
}

// ────────────────── Empty ─────────────────────
function EmptyResults({ hasFilter }: { hasFilter: boolean }) {
  return (
    <section className="py-16 px-6 bg-bg">
      <div className="max-w-[600px] mx-auto text-center">
        <p className="text-mist italic mb-4">
          {hasFilter
            ? "No shops match those filters. Try loosening one."
            : "No shops in the catalog yet. Check back soon."}
        </p>
        {hasFilter && (
          <Link
            href="/rentals"
            className="text-strava text-xs font-semibold uppercase tracking-wider hover:text-strava/80"
          >
            Clear filters
          </Link>
        )}
      </div>
    </section>
  );
}

// ────────────────── Submit / feedback CTA ─────
function SubmitCTA() {
  return (
    <section className="py-20 px-6 bg-surface border-t border-border">
      <div className="max-w-[700px] mx-auto text-center">
        <div className="text-[0.7rem] font-semibold tracking-[0.3em] uppercase text-brand mb-3">
          Missing a shop?
        </div>
        <h2 className="font-[family-name:var(--font-space-grotesk)] text-2xl md:text-3xl font-bold tracking-tight text-text mb-6">
          Tell us who to add.
        </h2>
        <p className="text-mist text-sm mb-6 max-w-[480px] mx-auto">
          Local shop we haven&apos;t listed? Detail out of date? Send it
          over. Every listing is editorially reviewed before it goes live.
        </p>
        <a
          href="mailto:laura@cyclinghawaii.com?subject=Rental%20shop%20submission"
          className="inline-flex items-center gap-2 px-6 py-3 rounded-full bg-strava text-white font-semibold text-sm uppercase tracking-wider hover:bg-strava/90 transition-colors"
        >
          Email Laura
          <svg
            width="14"
            height="14"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.5"
            viewBox="0 0 24 24"
          >
            <path d="M14 5l7 7m0 0l-7 7m7-7H3" />
          </svg>
        </a>
      </div>
    </section>
  );
}
