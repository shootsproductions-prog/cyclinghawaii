import type { Metadata } from "next";
import Image from "next/image";
import {
  getGroupedGear,
  priceTierLabel,
  type GearItem,
} from "@/lib/gear";

export const metadata: Metadata = {
  title: "What I Ride — Cycling Hawaii",
  description:
    "Laura's gear recommendations. Real opinions on real cycling gear, curated for Hawaiʻi roads. No affiliate links — just things that work.",
};

export const revalidate = 3600;

export default function GearPage() {
  const grouped = getGroupedGear();

  return (
    <main>
      <Hero />
      {grouped.map((group) => (
        <CategorySection
          key={group.category}
          label={group.label}
          blurb={group.blurb}
          items={group.items}
        />
      ))}
      <Disclosure />
    </main>
  );
}

// ───────────────────── Hero ─────────────────────
function Hero() {
  return (
    <section className="relative pt-32 pb-16 px-6 bg-gradient-to-b from-strava/10 via-bg to-bg overflow-hidden">
      <div className="max-w-[860px] mx-auto text-center">
        <div className="text-[0.7rem] md:text-xs font-semibold tracking-[0.3em] uppercase text-strava mb-4">
          Curated by Laura
        </div>
        <h1 className="font-[family-name:var(--font-space-grotesk)] text-4xl md:text-6xl lg:text-7xl font-bold tracking-tight text-text leading-[0.95] mb-5">
          What I<span className="text-strava"> Ride.</span>
        </h1>
        <p className="text-mist text-base md:text-lg max-w-[640px] mx-auto leading-relaxed">
          Real opinions on real cycling gear. Curated for Hawaiʻi roads.
          No affiliate links. No ads. Just things that work — and what to
          avoid.
        </p>
      </div>
    </section>
  );
}

// ─────────────── Category Section ───────────────
function CategorySection({
  label,
  blurb,
  items,
}: {
  label: string;
  blurb: string;
  items: GearItem[];
}) {
  return (
    <section className="py-16 px-6 bg-bg border-b border-border last:border-b-0">
      <div className="max-w-[1100px] mx-auto">
        <div className="text-center mb-12 max-w-[640px] mx-auto">
          <h2 className="font-[family-name:var(--font-space-grotesk)] text-3xl md:text-4xl font-bold tracking-tight text-text mb-3">
            {label}
          </h2>
          <p className="text-mist text-sm md:text-base italic leading-relaxed">
            {blurb}
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {items.map((item) => (
            <GearCard key={item.slug} item={item} />
          ))}
        </div>
      </div>
    </section>
  );
}

// ─────────────────── Card ───────────────────────
function GearCard({ item }: { item: GearItem }) {
  return (
    <article className="bg-card border border-border rounded-2xl overflow-hidden shadow-sm flex flex-col">
      {/* Image / placeholder */}
      <div className="relative aspect-[16/10] bg-surface overflow-hidden">
        {item.image ? (
          <Image
            src={item.image}
            alt={item.name}
            fill
            sizes="(min-width: 768px) 50vw, 100vw"
            className="object-cover"
          />
        ) : (
          <div className="w-full h-full bg-gradient-to-br from-strava/15 via-brand/10 to-mist/10 flex items-center justify-center p-6">
            <div className="font-[family-name:var(--font-space-grotesk)] text-xl md:text-2xl font-bold text-text/50 text-center leading-tight">
              {item.name}
            </div>
          </div>
        )}

        {/* Top-right pill */}
        <div className="absolute top-3 right-3 flex flex-col items-end gap-1.5">
          <span className="text-[0.6rem] font-bold uppercase tracking-wider px-2.5 py-1 rounded-full bg-card text-text border border-border shadow-sm">
            {priceTierLabel(item.priceTier)}
          </span>
          {item.pickTBD && (
            <span className="text-[0.55rem] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-mist/15 text-mist">
              Pick TBD
            </span>
          )}
        </div>
      </div>

      {/* Body */}
      <div className="p-6 flex-1 flex flex-col">
        <div className="mb-3">
          {(item.brand || item.model) && (
            <div className="text-[0.65rem] uppercase tracking-widest text-mist mb-1">
              {[item.brand, item.model].filter(Boolean).join(" · ")}
            </div>
          )}
          <h3 className="font-[family-name:var(--font-space-grotesk)] font-bold text-text text-xl leading-tight">
            {item.name}
          </h3>
        </div>

        <p className="text-text font-semibold text-sm md:text-base mb-3 leading-snug">
          {item.tagline}
        </p>

        <p className="text-mist text-sm leading-relaxed mb-4">
          {item.review}
        </p>

        {item.hawaiiAngle && (
          <div className="bg-strava/5 border-l-2 border-strava pl-4 py-2 mb-4">
            <div className="text-[0.6rem] uppercase tracking-widest text-strava font-semibold mb-1">
              Hawaiʻi angle
            </div>
            <p className="text-mist text-xs leading-relaxed italic">
              {item.hawaiiAngle}
            </p>
          </div>
        )}

        {item.warning && (
          <div className="bg-red-500/5 border-l-2 border-red-500 pl-4 py-2 mb-4">
            <div className="text-[0.6rem] uppercase tracking-widest text-red-600 font-semibold mb-1">
              Why we don&apos;t ride this
            </div>
            <p className="text-mist text-xs leading-relaxed italic">
              {item.warning}
            </p>
          </div>
        )}

        <div className="mt-auto pt-3 border-t border-border flex items-center justify-between">
          <span className="text-[0.6rem] uppercase tracking-widest text-mist">
            {item.pickTBD
              ? "Looking for: " + item.name
              : "On the bike now"}
          </span>
          {item.url && (
            <a
              href={item.url}
              target="_blank"
              rel="noopener noreferrer"
              className="text-strava text-xs font-semibold uppercase tracking-wider hover:text-strava/80 inline-flex items-center gap-1"
            >
              View
              <svg
                width="12"
                height="12"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.5"
                viewBox="0 0 24 24"
              >
                <path d="M14 5l7 7m0 0l-7 7m7-7H3" />
              </svg>
            </a>
          )}
        </div>
      </div>
    </article>
  );
}

// ──────────── Disclosure footer ─────────────────
function Disclosure() {
  return (
    <section className="py-20 px-6 bg-surface border-t border-border">
      <div className="max-w-[700px] mx-auto text-center">
        <div className="text-[0.7rem] font-semibold tracking-[0.3em] uppercase text-brand mb-3">
          The Promise
        </div>
        <h2 className="font-[family-name:var(--font-space-grotesk)] text-2xl md:text-3xl font-bold tracking-tight text-text mb-5">
          No affiliate links. No paid placements.
        </h2>
        <p className="text-mist text-sm md:text-base leading-relaxed mb-4">
          Every recommendation here is gear Vini actually rides — or wishes he
          did. We don&apos;t earn a commission, we don&apos;t accept payment
          for placement, and we don&apos;t recommend things we wouldn&apos;t
          buy ourselves.
        </p>
        <p className="text-mist text-sm md:text-base leading-relaxed mb-4">
          If that ever changes, you&apos;ll see a clear disclosure on every
          page that has it. Until then: it&apos;s just opinions.
        </p>
        <p className="text-mist text-xs italic mt-8">
          Got a piece of gear we should review? Email{" "}
          <a
            href="mailto:laura@cyclinghawaii.com?subject=Gear%20Suggestion"
            className="text-strava hover:underline"
          >
            laura@cyclinghawaii.com
          </a>
          . Honest feedback only.
        </p>
      </div>
    </section>
  );
}
