import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import {
  getGroupedProducts,
  formatPrice,
  statusLabel,
  type StoreProduct,
} from "@/lib/products";

export const metadata: Metadata = {
  title: "Store — Cycling Hawaii",
  description:
    "Cycling Hawaiʻi swag. Stickers, hats, shirts. Earned, not bought.",
};

export const revalidate = 3600;

export default async function StorePage() {
  const grouped = await getGroupedProducts();
  const hasProducts = grouped.some((g) => g.products.length > 0);

  return (
    <main>
      <Hero hasProducts={hasProducts} />
      {grouped.map((group) => (
        <CategorySection
          key={group.category}
          label={group.label}
          products={group.products}
        />
      ))}
      {!hasProducts && <EmptyState />}
      <Footer />
    </main>
  );
}

// ───────────────────── Hero ─────────────────────
function Hero({ hasProducts }: { hasProducts: boolean }) {
  return (
    <section className="relative pt-32 pb-16 px-6 bg-gradient-to-b from-strava/10 via-bg to-bg overflow-hidden">
      <div className="max-w-[860px] mx-auto text-center">
        <div className="text-[0.7rem] md:text-xs font-semibold tracking-[0.3em] uppercase text-strava mb-4">
          The Store
        </div>
        <h1 className="font-[family-name:var(--font-space-grotesk)] text-4xl md:text-6xl lg:text-7xl font-bold tracking-tight text-text leading-[0.95] mb-5">
          Cycling Hawaiʻi<span className="text-strava"> Goods</span>
        </h1>
        <p className="text-mist text-base md:text-lg max-w-[640px] mx-auto leading-relaxed">
          {hasProducts
            ? "Stickers. Hats. Shirts. Cycling Hawaiʻi on every kind of canvas."
            : "Coming soon. Stickers, hats, shirts. Earned, not bought."}
        </p>
      </div>
    </section>
  );
}

// ─────────── Category section + Card ────────────
function CategorySection({
  label,
  products,
}: {
  label: string;
  products: StoreProduct[];
}) {
  return (
    <section className="py-12 px-6 bg-bg border-b border-border last:border-b-0">
      <div className="max-w-[1100px] mx-auto">
        <div className="text-center mb-10">
          <h2 className="font-[family-name:var(--font-space-grotesk)] text-2xl md:text-3xl font-bold tracking-tight text-text">
            {label}
          </h2>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {products.map((p) => (
            <ProductCard key={p.slug} product={p} />
          ))}
        </div>
      </div>
    </section>
  );
}

function ProductCard({ product }: { product: StoreProduct }) {
  const primaryImage = product.images[0];
  const isLive = product.status === "published" && !!product.buyUrl;
  const statusBadge =
    product.status === "coming_soon" || product.status === "sold_out"
      ? statusLabel(product.status)
      : null;

  return (
    <Link
      href={`/store/${product.slug}`}
      className="group bg-card border border-border rounded-xl overflow-hidden shadow-sm hover:shadow-md transition-shadow flex flex-col no-underline"
    >
      {/* Image */}
      <div className="relative aspect-square bg-surface overflow-hidden">
        {primaryImage ? (
          <Image
            src={primaryImage}
            alt={product.name}
            fill
            sizes="(min-width: 1024px) 360px, (min-width: 768px) 50vw, 100vw"
            className="object-cover group-hover:scale-[1.03] transition-transform duration-500"
            unoptimized
          />
        ) : (
          <div className="w-full h-full bg-gradient-to-br from-strava/15 via-brand/10 to-mist/10 flex items-center justify-center p-6">
            <div className="font-[family-name:var(--font-space-grotesk)] text-base font-bold text-text/45 text-center leading-tight">
              {product.name}
            </div>
          </div>
        )}

        {/* Top-left: badge */}
        {product.badge && (
          <div className="absolute top-3 left-3">
            <span className="text-[0.6rem] font-bold uppercase tracking-wider px-2.5 py-1 rounded-full bg-strava text-white">
              {product.badge}
            </span>
          </div>
        )}

        {/* Top-right: exclusive */}
        {product.isExclusive && (
          <div className="absolute top-3 right-3">
            <span className="text-[0.6rem] font-bold uppercase tracking-wider px-2.5 py-1 rounded-full bg-text text-white">
              The Twelve
            </span>
          </div>
        )}

        {/* Status overlay (coming soon / sold out) */}
        {statusBadge && (
          <div className="absolute inset-0 bg-bg/70 backdrop-blur-[2px] flex items-center justify-center">
            <span className="text-[0.7rem] font-bold uppercase tracking-widest px-4 py-2 rounded-full bg-text text-white">
              {statusBadge}
            </span>
          </div>
        )}
      </div>

      {/* Body */}
      <div className="p-5 flex-1 flex flex-col">
        <h3 className="font-[family-name:var(--font-space-grotesk)] font-bold text-text text-base leading-tight mb-2">
          {product.name}
        </h3>
        {product.shortDescription && (
          <p className="text-mist text-sm leading-relaxed line-clamp-2 mb-3">
            {product.shortDescription}
          </p>
        )}
        <div className="mt-auto pt-3 border-t border-border flex items-center justify-between">
          <span className="font-[family-name:var(--font-space-grotesk)] font-bold text-text text-lg">
            {formatPrice(product.priceUSD)}
          </span>
          <span
            className={`text-[0.65rem] uppercase tracking-widest ${
              isLive ? "text-strava" : "text-mist"
            }`}
          >
            {isLive ? "View →" : statusLabel(product.status)}
          </span>
        </div>
      </div>
    </Link>
  );
}

// ───────────────── Empty state ──────────────────
function EmptyState() {
  return (
    <section className="py-20 px-6 bg-bg">
      <div className="max-w-[600px] mx-auto text-center">
        <p className="text-mist italic">
          No goods on the shelf right now. Check back soon.
        </p>
      </div>
    </section>
  );
}

// ───────────────────── Footer ───────────────────
function Footer() {
  return (
    <section className="py-16 px-6 bg-surface border-t border-border">
      <div className="max-w-[700px] mx-auto text-center">
        <p className="text-mist text-sm italic max-w-[480px] mx-auto leading-relaxed">
          You ride. Laura writes. We print. Drops are limited and irregular —
          when something lands, you&apos;ll see it here.
        </p>
        <p className="text-[0.6rem] uppercase tracking-widest text-mist/70 mt-6">
          Worldwide shipping · 100% earned
        </p>
      </div>
    </section>
  );
}
