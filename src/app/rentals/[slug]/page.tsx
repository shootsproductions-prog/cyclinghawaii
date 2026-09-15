import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import {
  RENTAL_SHOPS,
  getShop,
  BIKE_TYPE_LABEL,
  FEATURE_LABEL,
} from "@/lib/rentals";

interface Props {
  params: Promise<{ slug: string }>;
}

export async function generateStaticParams() {
  return RENTAL_SHOPS.map((s) => ({ slug: s.slug }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const shop = getShop(slug);
  if (!shop) return { title: "Shop not found — Cycling Hawaii" };
  const bikes = shop.bikeTypes
    .slice(0, 4)
    .map((t) => BIKE_TYPE_LABEL[t])
    .join(", ")
    .toLowerCase();
  return {
    title: `${shop.name} — Bike rentals in ${shop.town}, ${shop.island} — Cycling Hawaii`,
    description:
      shop.lauraTake ??
      `${shop.name} rents ${bikes} in ${shop.town}, ${shop.island}. Find hours, rates, and how to book.`,
    openGraph: shop.photo
      ? {
          title: shop.name,
          description: shop.lauraTake,
          images: [{ url: shop.photo }],
        }
      : undefined,
  };
}

export default async function ShopDetailPage({ params }: Props) {
  const { slug } = await params;
  const shop = getShop(slug);
  if (!shop) notFound();

  return (
    <main>
      {shop.verified === "placeholder" && <PlaceholderNotice />}
      <Hero shop={shop} />
      <QuickFacts shop={shop} />
      {shop.lauraTake && <LauraCard takeText={shop.lauraTake} />}
      {shop.notes && <NotesBlock notes={shop.notes} />}
      <BikeTypesBlock shop={shop} />
      {shop.features.length > 0 && <FeaturesBlock shop={shop} />}
      <RentCTA shop={shop} />
      <BackLink />
    </main>
  );
}

// ─── Placeholder notice ──────────────────
// If this specific shop is still a placeholder, warn on-page too.
function PlaceholderNotice() {
  return (
    <div className="bg-amber-500/10 border-b border-amber-500/30 text-amber-800 text-sm px-6 py-3 text-center">
      <strong className="font-semibold">Placeholder listing</strong> —
      this entry is a seed for the directory and hasn&apos;t been verified
      with a real shop yet. Do not book from these details.
    </div>
  );
}

// ───────────────────── Hero ─────────────────────
function Hero({ shop }: { shop: (typeof RENTAL_SHOPS)[number] }) {
  return (
    <section className="pt-24 md:pt-28 pb-10 md:pb-14 px-6 md:px-10 lg:px-16 bg-bg">
      <div className="max-w-[1280px] mx-auto">
        <div className="relative aspect-[16/8] md:aspect-[2.4/1] rounded-2xl overflow-hidden shadow-[0_20px_60px_-18px_rgba(0,0,0,0.22)] mb-10 md:mb-14 bg-surface">
          {shop.photo ? (
            <Image
              src={shop.photo}
              alt={shop.name}
              fill
              priority
              sizes="(min-width: 1280px) 1280px, 100vw"
              className="object-cover object-center"
            />
          ) : (
            <div className="w-full h-full bg-gradient-to-br from-strava/15 via-brand/10 to-mist/10 flex items-center justify-center p-10">
              <div className="font-[family-name:var(--font-space-grotesk)] text-3xl md:text-5xl font-bold text-text/40 text-center">
                {shop.name}
              </div>
            </div>
          )}
        </div>

        <div className="max-w-[860px]">
          <div className="flex flex-wrap items-center gap-2 mb-4">
            {shop.featured && (
              <span className="text-[0.65rem] font-bold uppercase tracking-wider px-2.5 py-1 rounded-full bg-strava text-white">
                Featured
              </span>
            )}
            {shop.alohaGravelReady && (
              <span className="text-[0.65rem] font-bold uppercase tracking-wider px-2.5 py-1 rounded-full bg-white text-strava border border-strava/30">
                Aloha Gravel ready
              </span>
            )}
            <span className="text-[0.7rem] md:text-xs font-semibold tracking-[0.3em] uppercase text-mist">
              {shop.island} · {shop.town}
            </span>
          </div>
          <h1 className="font-[family-name:var(--font-space-grotesk)] text-4xl md:text-6xl lg:text-7xl font-bold tracking-tight text-text leading-[0.95]">
            {shop.name}
          </h1>
        </div>
      </div>
    </section>
  );
}

// ──────────── Quick Facts ────────────────
function QuickFacts({ shop }: { shop: (typeof RENTAL_SHOPS)[number] }) {
  return (
    <section className="py-8 px-6 bg-bg">
      <div className="max-w-[860px] mx-auto">
        <div className="bg-card border border-border rounded-2xl p-6 md:p-8 shadow-sm">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-5">
            <Fact
              label="From"
              value={shop.priceFromUSD ? `$${shop.priceFromUSD}/day` : "See site"}
            />
            <Fact label="Town" value={shop.town} />
            <Fact label="Island" value={shop.island} />
            <Fact
              label="Phone"
              value={shop.phone ?? "See site"}
              link={shop.phone ? `tel:${shop.phone}` : undefined}
            />
          </div>
          {shop.address && (
            <div className="border-t border-border pt-4 mt-6">
              <div className="text-[0.6rem] uppercase tracking-widest text-mist mb-1">
                Address
              </div>
              <div className="font-semibold text-text text-sm leading-snug">
                {shop.address}
              </div>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}

function Fact({
  label,
  value,
  link,
}: {
  label: string;
  value: string;
  link?: string;
}) {
  return (
    <div>
      <div className="text-[0.6rem] uppercase tracking-widest text-mist mb-1">
        {label}
      </div>
      {link ? (
        <a
          href={link}
          className="font-semibold text-text text-sm leading-snug hover:text-strava transition-colors"
        >
          {value}
        </a>
      ) : (
        <div className="font-semibold text-text text-sm leading-snug">
          {value}
        </div>
      )}
    </div>
  );
}

// ──────────── Laura's Card ────────────────
function LauraCard({ takeText }: { takeText: string }) {
  return (
    <section className="py-8 px-6 bg-bg">
      <div className="max-w-[860px] mx-auto">
        <div className="bg-card border border-border rounded-2xl p-6 md:p-8 shadow-sm flex items-start gap-4">
          <div className="w-10 h-10 rounded-full bg-strava/10 flex items-center justify-center shrink-0 mt-1">
            <svg
              width="18"
              height="18"
              fill="none"
              stroke="#fc5200"
              strokeWidth="2"
              viewBox="0 0 24 24"
            >
              <path d="M12 20h9M16.5 3.5a2.121 2.121 0 013 3L7 19l-4 1 1-4L16.5 3.5z" />
            </svg>
          </div>
          <div>
            <div className="text-xs font-semibold text-strava uppercase tracking-wider mb-2">
              Laura&apos;s Take
            </div>
            <p className="text-text/85 text-base italic leading-relaxed">
              {takeText}
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}

// ──────────── Editorial notes ────────────
function NotesBlock({ notes }: { notes: string }) {
  return (
    <section className="py-4 px-6 bg-bg">
      <div className="max-w-[860px] mx-auto">
        <p className="text-mist text-sm leading-relaxed italic">
          {notes}
        </p>
      </div>
    </section>
  );
}

// ──────────── Bike types ────────────
function BikeTypesBlock({ shop }: { shop: (typeof RENTAL_SHOPS)[number] }) {
  return (
    <section className="py-8 px-6 bg-bg">
      <div className="max-w-[860px] mx-auto">
        <div className="text-[0.7rem] font-semibold tracking-[0.3em] uppercase text-brand mb-3">
          Bikes
        </div>
        <h2 className="font-[family-name:var(--font-space-grotesk)] text-xl md:text-2xl font-bold tracking-tight text-text mb-5">
          What they rent
        </h2>
        <div className="flex flex-wrap gap-2">
          {shop.bikeTypes.map((t) => (
            <span
              key={t}
              className="text-xs font-semibold uppercase tracking-wider px-3 py-1.5 rounded-full bg-strava/10 text-strava"
            >
              {BIKE_TYPE_LABEL[t]}
            </span>
          ))}
        </div>
      </div>
    </section>
  );
}

// ──────────── Features ────────────
function FeaturesBlock({ shop }: { shop: (typeof RENTAL_SHOPS)[number] }) {
  return (
    <section className="py-8 px-6 bg-bg">
      <div className="max-w-[860px] mx-auto">
        <div className="text-[0.7rem] font-semibold tracking-[0.3em] uppercase text-brand mb-3">
          Good to know
        </div>
        <ul className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {shop.features.map((f) => (
            <li
              key={f}
              className="flex items-center gap-2 text-sm text-text/85"
            >
              <svg
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke="#fc5200"
                strokeWidth="2.5"
                className="shrink-0"
              >
                <path d="M5 13l4 4L19 7" />
              </svg>
              {FEATURE_LABEL[f]}
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}

// ──────────── Rent CTA — sends to the shop's own site ─
function RentCTA({ shop }: { shop: (typeof RENTAL_SHOPS)[number] }) {
  const bookHref = shop.bookingUrl ?? shop.website;
  return (
    <section className="py-16 px-6 bg-bg">
      <div className="max-w-[700px] mx-auto text-center">
        <div className="text-[0.7rem] font-semibold tracking-[0.3em] uppercase text-brand mb-3">
          Rent
        </div>
        <h2 className="font-[family-name:var(--font-space-grotesk)] text-2xl md:text-4xl font-bold tracking-tight text-text mb-3">
          Ready to book?
        </h2>
        <p className="text-mist text-sm mb-6 italic max-w-[480px] mx-auto">
          Booking happens on {shop.name}&apos;s own site — we&apos;re just
          the directory. Rates, availability, and terms live there.
        </p>
        <div className="flex flex-wrap items-center justify-center gap-3">
          <a
            href={bookHref}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 px-7 py-3 rounded-full bg-strava text-white font-semibold text-sm uppercase tracking-wider hover:bg-strava/90 transition-colors shadow-md shadow-strava/20"
          >
            Rent from {shop.name.replace(/^PLACEHOLDER — /, "")}
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
          {shop.phone && (
            <a
              href={`tel:${shop.phone}`}
              className="inline-flex items-center gap-2 px-6 py-3 rounded-full bg-card border border-border text-text font-semibold text-sm uppercase tracking-wider hover:border-strava hover:text-strava transition-colors"
            >
              Call {shop.phone}
            </a>
          )}
        </div>
        <p className="text-mist text-xs italic mt-8">
          Something off with this listing?{" "}
          <a
            href={`mailto:laura@cyclinghawaii.com?subject=Correction:%20${encodeURIComponent(
              shop.name
            )}`}
            className="text-strava hover:underline"
          >
            Tell Laura.
          </a>
        </p>
      </div>
    </section>
  );
}

function BackLink() {
  return (
    <section className="pb-12 px-6 bg-bg">
      <div className="max-w-[700px] mx-auto text-center">
        <Link
          href="/rentals"
          className="text-strava font-semibold text-xs uppercase tracking-wider hover:text-strava/80"
        >
          ← All rentals
        </Link>
      </div>
    </section>
  );
}
