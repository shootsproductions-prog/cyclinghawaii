import type { Metadata } from "next";
import Image from "next/image";
import {
  getHawaiiRoutes,
  buildRouteMapUrl,
  type FormattedRoute,
} from "@/lib/routes";

export const metadata: Metadata = {
  title: "Routes — Cycling Hawaii",
  description:
    "Vini's curated Maui cycling routes. Maps, stats, and downloads. Build your own ride from the same lines a local rides every week.",
};

export const revalidate = 3600;

export default async function RoutesPage() {
  const routes = await getHawaiiRoutes();

  // Sort by elevation per mile (toughest routes feel "headlining")
  const sorted = [...routes].sort((a, b) => {
    const aDensity = a.distanceMi > 0 ? a.elevationFt / a.distanceMi : 0;
    const bDensity = b.distanceMi > 0 ? b.elevationFt / b.distanceMi : 0;
    return bDensity - aDensity;
  });

  return (
    <main>
      <Hero count={sorted.length} />
      {sorted.length > 0 ? (
        <RouteGrid routes={sorted} />
      ) : (
        <EmptyState />
      )}
      <ComingSoon />
    </main>
  );
}

// ───────────────────── Hero ─────────────────────
function Hero({ count }: { count: number }) {
  return (
    <section className="relative pt-32 pb-16 px-6 bg-gradient-to-b from-strava/10 via-bg to-bg">
      <div className="max-w-[820px] mx-auto text-center">
        <div className="text-[0.7rem] md:text-xs font-semibold tracking-[0.3em] uppercase text-strava mb-4">
          The Library
        </div>
        <h1 className="font-[family-name:var(--font-space-grotesk)] text-4xl md:text-6xl lg:text-7xl font-bold tracking-tight text-text leading-[0.95] mb-5">
          Maui<span className="text-strava"> Routes</span>
        </h1>
        <p className="text-mist text-base md:text-lg max-w-[620px] mx-auto leading-relaxed">
          {count > 0
            ? `${count} curated cycling routes across the islands. Pulled live from my Strava. View, ride, repeat.`
            : "Routes loading. Check back in a moment."}
        </p>
      </div>
    </section>
  );
}

// ──────────────────── Grid ──────────────────────
function RouteGrid({ routes }: { routes: FormattedRoute[] }) {
  return (
    <section className="py-16 px-6 bg-bg">
      <div className="max-w-[1200px] mx-auto grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {routes.map((r) => (
          <RouteCard key={r.id} route={r} />
        ))}
      </div>
    </section>
  );
}

function RouteCard({ route }: { route: FormattedRoute }) {
  const mapUrl = buildRouteMapUrl(route.polyline, 600, 320);
  return (
    <a
      href={route.stravaUrl}
      target="_blank"
      rel="noopener noreferrer"
      className="group bg-card border border-border rounded-2xl overflow-hidden shadow-sm hover:shadow-lg transition-shadow flex flex-col no-underline"
    >
      {/* Map */}
      <div className="relative aspect-[16/9] bg-surface overflow-hidden">
        {mapUrl ? (
          <Image
            src={mapUrl}
            alt={route.name}
            fill
            sizes="(min-width: 1024px) 380px, (min-width: 768px) 50vw, 100vw"
            className="object-cover group-hover:scale-[1.03] transition-transform duration-500"
            unoptimized
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-mist text-xs uppercase tracking-widest">
            No map
          </div>
        )}
        {/* Type chip */}
        <div className="absolute top-3 left-3">
          <span
            className={`text-[0.6rem] font-bold uppercase tracking-wider px-2 py-1 rounded-full ${
              route.type === "Gravel"
                ? "bg-[#b45309] text-white"
                : route.type === "MTB"
                ? "bg-[#059669] text-white"
                : "bg-strava text-white"
            }`}
          >
            {route.type}
          </span>
        </div>
      </div>

      {/* Body */}
      <div className="p-5 flex-1 flex flex-col">
        <h3 className="font-[family-name:var(--font-space-grotesk)] font-bold text-text text-lg leading-tight mb-3 line-clamp-2">
          {route.name}
        </h3>

        <div className="grid grid-cols-3 gap-3 text-sm mb-4">
          <Stat value={route.distanceMi.toFixed(1)} label="mi" />
          <Stat value={route.elevationFt.toLocaleString()} label="ft" />
          <Stat
            value={route.estimatedHours > 0 ? `${route.estimatedHours}h` : "—"}
            label="est"
          />
        </div>

        <div className="flex items-center justify-between mt-auto pt-3 border-t border-border">
          <span className="text-[0.65rem] text-mist uppercase tracking-widest">
            View on Strava
          </span>
          <span className="text-strava group-hover:translate-x-1 transition-transform">
            <svg
              width="16"
              height="16"
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
    </a>
  );
}

function Stat({ value, label }: { value: string; label: string }) {
  return (
    <div>
      <div className="font-semibold text-text font-[family-name:var(--font-space-grotesk)]">
        {value}
      </div>
      <div className="text-[0.6rem] uppercase tracking-wider text-mist mt-0.5">
        {label}
      </div>
    </div>
  );
}

function EmptyState() {
  return (
    <section className="py-16 px-6 bg-bg">
      <div className="max-w-[600px] mx-auto text-center">
        <p className="text-mist italic">No routes published yet. Check back soon.</p>
      </div>
    </section>
  );
}

// ──────────────── Coming Soon ───────────────────
function ComingSoon() {
  return (
    <section className="py-20 px-6 bg-surface border-t border-border">
      <div className="max-w-[700px] mx-auto text-center">
        <div className="text-[0.7rem] font-semibold tracking-[0.3em] uppercase text-brand mb-3">
          Coming Soon
        </div>
        <h2 className="font-[family-name:var(--font-space-grotesk)] text-3xl md:text-4xl font-bold tracking-tight text-text mb-5">
          Tour de Maui — 2026 Edition
        </h2>
        <p className="text-mist text-base mb-3 leading-relaxed">
          Twelve stages. Four jerseys. One Queen Stage that breaks bigger
          riders than us.
        </p>
        <p className="text-mist text-sm italic">
          Connected riders log their stages by tagging{" "}
          <strong className="text-strava">#tdm-stage-N</strong> on Strava.
          Laura keeps the standings. The yellow jersey is yours to lose.
        </p>
        <p className="text-mist text-xs italic mt-6">
          Spec live, build incoming. Connect at /roast to be among the first
          on the start line.
        </p>
      </div>
    </section>
  );
}
