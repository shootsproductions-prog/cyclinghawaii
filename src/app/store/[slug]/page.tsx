import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import {
  getProduct,
  getPublishedProducts,
  getProductsByCategory,
  formatPrice,
  statusLabel,
  PRODUCTS,
  type StoreProduct,
} from "@/lib/products";

interface Props {
  params: Promise<{ slug: string }>;
}

export async function generateStaticParams() {
  return PRODUCTS.filter((p) => p.status !== "draft").map((p) => ({
    slug: p.slug,
  }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const product = getProduct(slug);
  if (!product) return { title: "Not found — Cycling Hawaii" };
  return {
    title: `${product.name} — Cycling Hawaii`,
    description:
      product.shortDescription ?? product.description.slice(0, 160),
    openGraph: product.images[0]
      ? {
          title: product.name,
          description: product.shortDescription,
          images: [{ url: product.images[0] }],
        }
      : undefined,
  };
}

export default async function ProductPage({ params }: Props) {
  const { slug } = await params;
  const product = getProduct(slug);
  if (!product || product.status === "draft") notFound();

  const related = getProductsByCategory(product.category)
    .filter((p) => p.slug !== product.slug)
    .slice(0, 3);

  return (
    <main>
      <Hero product={product} />
      {related.length > 0 && <Related products={related} />}
      <BackLink />
    </main>
  );
}

// ───────────────────── Hero ─────────────────────
function Hero({ product }: { product: StoreProduct }) {
  const primaryImage = product.images[0];
  const isLive = product.status === "published" && !!product.buyUrl;

  return (
    <section className="pt-28 pb-16 px-6 bg-bg">
      <div className="max-w-[1100px] mx-auto grid md:grid-cols-2 gap-10 lg:gap-16">
        {/* Image column */}
        <div>
          <div className="relative aspect-square bg-surface rounded-2xl overflow-hidden border border-border">
            {primaryImage ? (
              <Image
                src={primaryImage}
                alt={product.name}
                fill
                priority
                sizes="(min-width: 768px) 50vw, 100vw"
                className="object-cover"
              />
            ) : (
              <div className="w-full h-full bg-gradient-to-br from-strava/15 via-brand/10 to-mist/10 flex items-center justify-center p-10">
                <div className="font-[family-name:var(--font-space-grotesk)] text-2xl md:text-3xl font-bold text-text/40 text-center">
                  {product.name}
                </div>
              </div>
            )}
          </div>

          {/* Image thumbnail strip (if multiple) */}
          {product.images.length > 1 && (
            <div className="grid grid-cols-4 gap-2 mt-3">
              {product.images.slice(0, 4).map((img, i) => (
                <div
                  key={i}
                  className="relative aspect-square bg-surface rounded-md overflow-hidden border border-border"
                >
                  <Image
                    src={img}
                    alt={`${product.name} ${i + 1}`}
                    fill
                    sizes="80px"
                    className="object-cover"
                  />
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Body column */}
        <div className="flex flex-col">
          <div className="flex flex-wrap items-center gap-2 mb-4">
            <span className="text-[0.6rem] font-bold uppercase tracking-widest px-2.5 py-1 rounded-full bg-mist/10 text-mist">
              {product.category}
            </span>
            {product.badge && (
              <span className="text-[0.6rem] font-bold uppercase tracking-wider px-2.5 py-1 rounded-full bg-strava text-white">
                {product.badge}
              </span>
            )}
            {product.isExclusive && (
              <span className="text-[0.6rem] font-bold uppercase tracking-wider px-2.5 py-1 rounded-full bg-text text-white">
                The Twelve only
              </span>
            )}
          </div>

          <h1 className="font-[family-name:var(--font-space-grotesk)] text-3xl md:text-4xl font-bold tracking-tight text-text leading-tight mb-3">
            {product.name}
          </h1>

          <div className="font-[family-name:var(--font-space-grotesk)] text-3xl font-bold text-strava mb-5">
            {formatPrice(product.priceUSD)}
          </div>

          {product.description && (
            <p className="text-mist text-base leading-relaxed mb-6">
              {product.description}
            </p>
          )}

          {/* CTA */}
          {isLive ? (
            <a
              href={product.buyUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center justify-center gap-2 px-7 py-4 rounded-full bg-strava text-white font-semibold text-sm uppercase tracking-wider hover:bg-strava/90 transition-colors shadow-md shadow-strava/20"
            >
              Buy Now
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
          ) : (
            <div className="inline-flex items-center justify-center gap-2 px-7 py-4 rounded-full bg-card border border-border text-mist font-semibold text-sm uppercase tracking-wider cursor-not-allowed">
              {statusLabel(product.status)}
            </div>
          )}

          {product.status === "coming_soon" && (
            <p className="text-mist text-xs italic mt-4">
              Email{" "}
              <a
                href={`mailto:laura@cyclinghawaii.com?subject=${encodeURIComponent(
                  `Notify me: ${product.name}`
                )}`}
                className="text-strava hover:underline"
              >
                laura@cyclinghawaii.com
              </a>{" "}
              to get notified when this drops.
            </p>
          )}
        </div>
      </div>
    </section>
  );
}

// ──────────────── Related Products ──────────────
function Related({ products }: { products: StoreProduct[] }) {
  void getPublishedProducts; // imported above for symmetry, not used here
  return (
    <section className="py-12 px-6 bg-surface border-t border-border">
      <div className="max-w-[1100px] mx-auto">
        <div className="text-center mb-8">
          <div className="text-[0.7rem] font-semibold tracking-[0.3em] uppercase text-brand mb-2">
            More Like This
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          {products.map((p) => (
            <RelatedCard key={p.slug} product={p} />
          ))}
        </div>
      </div>
    </section>
  );
}

function RelatedCard({ product }: { product: StoreProduct }) {
  const primaryImage = product.images[0];
  return (
    <Link
      href={`/store/${product.slug}`}
      className="group bg-card border border-border rounded-xl overflow-hidden flex flex-col no-underline"
    >
      <div className="relative aspect-square bg-surface overflow-hidden">
        {primaryImage ? (
          <Image
            src={primaryImage}
            alt={product.name}
            fill
            sizes="(min-width: 768px) 320px, 100vw"
            className="object-cover group-hover:scale-[1.03] transition-transform duration-500"
          />
        ) : (
          <div className="w-full h-full bg-gradient-to-br from-strava/15 via-brand/10 to-mist/10 flex items-center justify-center p-4">
            <div className="font-[family-name:var(--font-space-grotesk)] text-sm font-bold text-text/45 text-center">
              {product.name}
            </div>
          </div>
        )}
      </div>
      <div className="p-4 flex items-center justify-between">
        <div>
          <div className="font-semibold text-text text-sm leading-tight">
            {product.name}
          </div>
          <div className="text-mist text-xs mt-0.5">
            {formatPrice(product.priceUSD)}
          </div>
        </div>
        <span className="text-strava">
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
    </Link>
  );
}

function BackLink() {
  return (
    <section className="pb-16 px-6 bg-bg">
      <div className="max-w-[700px] mx-auto text-center">
        <Link
          href="/store"
          className="text-strava font-semibold text-xs uppercase tracking-wider hover:text-strava/80"
        >
          ← All goods
        </Link>
      </div>
    </section>
  );
}
