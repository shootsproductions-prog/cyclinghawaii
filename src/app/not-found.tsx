import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "404 — Cycling Hawaii",
  description:
    "Wrong number. The page you tried doesn't exist on this island.",
};

export default function NotFound() {
  return (
    <main className="min-h-[100dvh] pt-32 pb-20 px-6 bg-gradient-to-b from-strava/10 via-bg to-bg">
      <div className="max-w-[760px] mx-auto text-center">
        <div className="text-[0.7rem] md:text-xs font-semibold tracking-[0.3em] uppercase text-strava mb-6">
          Lost on the ride
        </div>

        <h1 className="font-[family-name:var(--font-space-grotesk)] text-7xl md:text-9xl lg:text-[12rem] font-bold tracking-tight text-text leading-[0.85] mb-6">
          4<span className="text-strava">0</span>4
        </h1>

        <p className="font-[family-name:var(--font-space-grotesk)] text-2xl md:text-3xl font-bold text-text mb-3">
          Wrong area code.
          <br />
          We&apos;re <span className="text-strava">808</span> over here.
        </p>

        <p className="text-mist text-base md:text-lg italic max-w-[520px] mx-auto leading-relaxed mb-10">
          The page you&apos;re looking for doesn&apos;t exist on this island.
          Or any island. Laura&apos;s pretty sure you took a wrong turn.
        </p>

        <div className="flex flex-wrap items-center justify-center gap-3">
          <Link
            href="/"
            className="inline-flex items-center gap-2 px-7 py-3 rounded-full bg-strava text-white font-semibold text-sm uppercase tracking-wider hover:bg-strava/90 transition-colors shadow-md shadow-strava/20"
          >
            Take me home
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
          </Link>
          <Link
            href="/club"
            className="inline-flex items-center gap-2 px-6 py-3 rounded-full bg-card border border-border text-text font-semibold text-sm uppercase tracking-wider hover:border-strava hover:text-strava transition-colors"
          >
            Join the club
          </Link>
        </div>

        <p className="text-mist/70 text-xs italic mt-12">
          — Laura, dialing the right area code since 2026
        </p>
      </div>
    </main>
  );
}
