import type { Metadata } from "next";
import { getTourStandings, type TourStandings, type JerseyHolder } from "@/lib/tour";
import {
  TOUR_STAGES,
  currentMonthStage,
  type TourStage,
} from "@/lib/tour-stages";
import {
  lauraTourHeadline,
  lauraMonthlyStageLine,
} from "@/lib/tour-laura";

export const metadata: Metadata = {
  title: "Tour de Maui — Cycling Hawaii",
  description:
    "The 2026 Tour de Maui. 12 stages. 4 jerseys. One Queen Stage. Laura keeps the standings. Tag #tdm-stage-N on Strava to compete.",
};

export const revalidate = 900;

export default async function TourPage() {
  const standings = await getTourStandings();
  const featured = currentMonthStage();
  const featuredCount = standings.stageCompletionCounts.get(featured.number) ?? 0;

  return (
    <main>
      <Hero year={standings.year} headline={lauraTourHeadline(standings)} />
      <Jerseys standings={standings} />
      <FeaturedStage stage={featured} count={featuredCount} />
      <Standings standings={standings} />
      <StageList standings={standings} />
      <HowItWorks />
    </main>
  );
}

// ───────────────────── Hero ─────────────────────
function Hero({ year, headline }: { year: number; headline: string }) {
  return (
    <section className="relative pt-32 pb-16 px-6 bg-gradient-to-b from-strava/15 via-bg to-bg overflow-hidden">
      <div className="max-w-[860px] mx-auto text-center">
        <div className="text-[0.7rem] font-semibold tracking-[0.3em] uppercase text-strava mb-4">
          The 2026 Edition
        </div>
        <h1 className="font-[family-name:var(--font-space-grotesk)] text-5xl md:text-7xl lg:text-8xl font-bold tracking-tight text-text leading-[0.95] mb-6">
          Tour de
          <span className="text-strava"> Maui</span>
        </h1>
        <p className="text-mist text-base md:text-lg max-w-[680px] mx-auto leading-relaxed">
          Twelve stages. One per month. Four jerseys. Laura keeps the books.
          Tag <strong className="text-strava">#tdm-stage-N</strong> on Strava
          to compete.
        </p>
        <div className="mt-8 max-w-[640px] mx-auto bg-card border border-border rounded-xl p-5 text-left">
          <div className="flex items-start gap-3">
            <div className="w-8 h-8 rounded-full bg-strava/10 flex items-center justify-center shrink-0">
              <svg
                width="16"
                height="16"
                fill="none"
                stroke="#fc5200"
                strokeWidth="2"
                viewBox="0 0 24 24"
              >
                <path d="M12 20h9M16.5 3.5a2.121 2.121 0 013 3L7 19l-4 1 1-4L16.5 3.5z" />
              </svg>
            </div>
            <div>
              <div className="text-xs font-semibold text-strava uppercase tracking-wider mb-1">
                Laura&apos;s Headline · {year}
              </div>
              <p className="text-mist text-sm italic leading-relaxed">
                {headline}
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

// ──────────────────── Jerseys ───────────────────
function Jerseys({ standings }: { standings: TourStandings }) {
  if (standings.jerseys.length === 0) {
    return (
      <section className="py-12 px-6 bg-bg">
        <div className="max-w-[1100px] mx-auto text-center">
          <p className="text-mist italic">
            All four jerseys are unclaimed. Be the first.
          </p>
        </div>
      </section>
    );
  }

  return (
    <section className="py-16 px-6 bg-bg">
      <div className="max-w-[1100px] mx-auto">
        <div className="text-center mb-10">
          <div className="text-[0.7rem] font-semibold tracking-[0.3em] uppercase text-brand mb-3">
            The Jerseys
          </div>
          <h2 className="font-[family-name:var(--font-space-grotesk)] text-3xl md:text-4xl font-bold tracking-tight text-text">
            Who&apos;s wearing what
          </h2>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {standings.jerseys
            .filter((j) => j.jersey !== "lanterne")
            .map((j) => (
              <JerseyCard key={j.jersey} jersey={j} />
            ))}
        </div>

        {standings.jerseys.find((j) => j.jersey === "lanterne") && (
          <div className="mt-6 max-w-[600px] mx-auto">
            <LanterneCard
              jersey={standings.jerseys.find((j) => j.jersey === "lanterne")!}
            />
          </div>
        )}
      </div>
    </section>
  );
}

const JERSEY_VISUALS: Record<
  JerseyHolder["jersey"],
  { label: string; bg: string; text: string; emoji: string; border: string }
> = {
  yellow: {
    label: "Maillot Jaune",
    bg: "bg-[#fde047]",
    text: "text-[#713f12]",
    emoji: "🟡",
    border: "border-[#fde047]",
  },
  polka: {
    label: "Maillot à Pois",
    bg: "bg-white",
    text: "text-[#dc2626]",
    emoji: "⚫⚪",
    border: "border-[#dc2626]",
  },
  green: {
    label: "Maillot Vert",
    bg: "bg-[#86efac]",
    text: "text-[#14532d]",
    emoji: "🟢",
    border: "border-[#86efac]",
  },
  white: {
    label: "Maillot Blanc",
    bg: "bg-white",
    text: "text-text",
    emoji: "⚪",
    border: "border-border",
  },
  lanterne: {
    label: "Lanterne Rouge",
    bg: "bg-[#fee2e2]",
    text: "text-[#991b1b]",
    emoji: "🔴",
    border: "border-[#fca5a5]",
  },
};

function JerseyCard({ jersey }: { jersey: JerseyHolder }) {
  const v = JERSEY_VISUALS[jersey.jersey];
  return (
    <div
      className={`rounded-2xl p-5 border-2 shadow-sm ${v.bg} ${v.border}`}
    >
      <div className="flex items-center gap-2 mb-3">
        <span className="text-xl">{v.emoji}</span>
        <span className={`text-[0.65rem] font-bold uppercase tracking-widest ${v.text} opacity-80`}>
          {v.label}
        </span>
      </div>
      <div className={`font-[family-name:var(--font-space-grotesk)] font-bold text-xl mb-1 ${v.text}`}>
        {jersey.firstname} {jersey.lastname[0]}.
      </div>
      <div className={`font-[family-name:var(--font-space-grotesk)] text-2xl md:text-3xl font-bold ${v.text}`}>
        {jersey.statValue}
      </div>
      <div className={`text-xs uppercase tracking-wider opacity-70 mt-1 ${v.text}`}>
        {jersey.metric}
      </div>
    </div>
  );
}

function LanterneCard({ jersey }: { jersey: JerseyHolder }) {
  const v = JERSEY_VISUALS.lanterne;
  return (
    <div
      className={`rounded-xl p-4 border ${v.bg} ${v.border} flex items-center gap-4`}
    >
      <span className="text-2xl">{v.emoji}</span>
      <div className="flex-1">
        <div className={`text-[0.65rem] font-bold uppercase tracking-widest ${v.text} opacity-80`}>
          {v.label}
        </div>
        <div className={`font-[family-name:var(--font-space-grotesk)] font-bold text-lg ${v.text}`}>
          {jersey.firstname} {jersey.lastname[0]}. — {jersey.stat}
        </div>
        <div className={`text-xs italic opacity-70 ${v.text}`}>
          Last in standings, first in our hearts.
        </div>
      </div>
    </div>
  );
}

// ────────────── Featured Stage ───────────────
function FeaturedStage({
  stage,
  count,
}: {
  stage: TourStage;
  count: number;
}) {
  return (
    <section className="py-16 px-6 bg-surface border-y border-border">
      <div className="max-w-[800px] mx-auto">
        <div className="text-center mb-8">
          <div className="text-[0.7rem] font-semibold tracking-[0.3em] uppercase text-brand mb-3">
            {stage.monthName} · This Month&apos;s Stage
          </div>
          <h2 className="font-[family-name:var(--font-space-grotesk)] text-3xl md:text-4xl font-bold tracking-tight text-text mb-2">
            Stage {stage.number}: {stage.name}
          </h2>
          <p className="text-mist text-sm uppercase tracking-widest">
            {stage.type}
          </p>
        </div>

        <div className="bg-card border border-border rounded-2xl p-6 md:p-8 shadow-sm">
          <p className="text-text text-base md:text-lg italic mb-5 leading-relaxed">
            &ldquo;{stage.description}&rdquo;
          </p>

          <div className="grid grid-cols-3 gap-4 text-center mb-5 border-y border-border py-5">
            <div>
              <div className="font-[family-name:var(--font-space-grotesk)] text-2xl font-bold text-text">
                {stage.distanceMi}
              </div>
              <div className="text-[0.6rem] uppercase tracking-wider text-mist mt-1">
                miles
              </div>
            </div>
            <div>
              <div className="font-[family-name:var(--font-space-grotesk)] text-2xl font-bold text-text">
                {stage.elevationFt.toLocaleString()}
              </div>
              <div className="text-[0.6rem] uppercase tracking-wider text-mist mt-1">
                feet
              </div>
            </div>
            <div>
              <div className="font-[family-name:var(--font-space-grotesk)] text-2xl font-bold text-strava">
                {count}
              </div>
              <div className="text-[0.6rem] uppercase tracking-wider text-mist mt-1">
                finishers
              </div>
            </div>
          </div>

          <div className="border-t border-border pt-5 flex items-start gap-3">
            <div className="w-8 h-8 rounded-full bg-strava/10 flex items-center justify-center shrink-0 mt-0.5">
              <svg
                width="16"
                height="16"
                fill="none"
                stroke="#fc5200"
                strokeWidth="2"
                viewBox="0 0 24 24"
              >
                <path d="M12 20h9M16.5 3.5a2.121 2.121 0 013 3L7 19l-4 1 1-4L16.5 3.5z" />
              </svg>
            </div>
            <div>
              <div className="text-xs font-semibold text-strava uppercase tracking-wider mb-1">
                Laura&apos;s Read
              </div>
              <p className="text-mist text-sm italic leading-relaxed">
                {lauraMonthlyStageLine(stage, count)}
              </p>
            </div>
          </div>

          <div className="mt-5 pt-5 border-t border-border">
            <div className="text-xs text-mist mb-2 uppercase tracking-wider">
              How to compete
            </div>
            <p className="text-mist text-sm leading-relaxed">
              Ride the route. Tag your activity{" "}
              <strong className="text-strava">{stage.tags[0]}</strong> on
              Strava.{" "}
              {stage.routeId && (
                <>
                  <a
                    href={`https://www.strava.com/routes/${stage.routeId}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-strava hover:underline"
                  >
                    Get the route here
                  </a>
                  .
                </>
              )}
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}

// ─────────────── Standings ──────────────────
function Standings({ standings }: { standings: TourStandings }) {
  if (standings.ridersByStages.length === 0) return null;

  return (
    <section className="py-16 px-6 bg-bg">
      <div className="max-w-[800px] mx-auto">
        <div className="text-center mb-8">
          <div className="text-[0.7rem] font-semibold tracking-[0.3em] uppercase text-brand mb-3">
            General Classification
          </div>
          <h2 className="font-[family-name:var(--font-space-grotesk)] text-3xl md:text-4xl font-bold tracking-tight text-text">
            The Standings
          </h2>
        </div>

        <div className="bg-card border border-border rounded-2xl overflow-hidden">
          <div className="grid grid-cols-[40px_1fr_60px_100px] gap-4 px-5 py-3 bg-surface border-b border-border text-[0.6rem] uppercase tracking-widest text-mist font-bold">
            <div>#</div>
            <div>Rider</div>
            <div className="text-right">Stages</div>
            <div className="text-right">Elevation</div>
          </div>
          {standings.ridersByStages.map((r, i) => (
            <div
              key={r.athleteKey}
              className="grid grid-cols-[40px_1fr_60px_100px] gap-4 px-5 py-4 border-b border-border last:border-b-0 items-center"
            >
              <div className="font-[family-name:var(--font-space-grotesk)] font-bold text-mist">
                {i + 1}
              </div>
              <div>
                <div className="font-semibold text-text text-sm">
                  {r.firstname} {r.lastname[0]}.
                </div>
                <div className="text-[0.65rem] text-mist uppercase tracking-wider mt-0.5">
                  Stages: {r.stageNumbers.sort((a, b) => a - b).join(", ")}
                </div>
              </div>
              <div className="text-right">
                <div className="font-[family-name:var(--font-space-grotesk)] font-bold text-strava text-lg">
                  {r.stagesCompleted}
                </div>
                <div className="text-[0.55rem] uppercase tracking-wider text-mist">
                  / 12
                </div>
              </div>
              <div className="text-right text-text font-semibold text-sm">
                {r.totalElevationFt.toLocaleString()}
                <span className="text-[0.55rem] uppercase tracking-wider text-mist ml-1">ft</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

// ─────────────── Stage List ─────────────────
function StageList({ standings }: { standings: TourStandings }) {
  return (
    <section className="py-16 px-6 bg-surface">
      <div className="max-w-[1100px] mx-auto">
        <div className="text-center mb-10">
          <div className="text-[0.7rem] font-semibold tracking-[0.3em] uppercase text-brand mb-3">
            All 12 Stages
          </div>
          <h2 className="font-[family-name:var(--font-space-grotesk)] text-3xl md:text-4xl font-bold tracking-tight text-text mb-2">
            The Calendar
          </h2>
          <p className="text-mist text-sm italic">
            Any order, any time. Tag your ride to claim a stage.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {TOUR_STAGES.map((s) => {
            const count = standings.stageCompletionCounts.get(s.number) ?? 0;
            return <StageCard key={s.number} stage={s} count={count} />;
          })}
        </div>
      </div>
    </section>
  );
}

function StageCard({ stage, count }: { stage: TourStage; count: number }) {
  const isCurrent = stage.month === new Date().getMonth() + 1;
  return (
    <div
      className={`bg-card rounded-xl p-5 flex flex-col gap-3 border-2 transition-shadow hover:shadow-md ${
        isCurrent ? "border-strava shadow-md" : "border-border"
      }`}
    >
      <div className="flex items-center justify-between">
        <span
          className="text-[0.6rem] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full text-white"
          style={{ backgroundColor: stage.accent }}
        >
          Stage {stage.number}
        </span>
        <span className="text-[0.6rem] uppercase tracking-widest text-mist font-semibold">
          {stage.monthName}
        </span>
      </div>

      <div>
        <h3 className="font-[family-name:var(--font-space-grotesk)] font-bold text-text text-base leading-tight">
          {stage.name}
        </h3>
        <div className="text-[0.65rem] uppercase tracking-wider text-mist mt-1">
          {stage.type}
          {stage.isLegendary && " · 👑"}
          {stage.isSpecial && " · 🌺"}
        </div>
      </div>

      <div className="grid grid-cols-3 gap-2 text-xs pt-3 border-t border-border">
        <div>
          <div className="font-semibold text-text font-[family-name:var(--font-space-grotesk)]">
            {stage.distanceMi}
          </div>
          <div className="text-[0.55rem] uppercase tracking-wider text-mist">mi</div>
        </div>
        <div>
          <div className="font-semibold text-text font-[family-name:var(--font-space-grotesk)]">
            {stage.elevationFt.toLocaleString()}
          </div>
          <div className="text-[0.55rem] uppercase tracking-wider text-mist">ft</div>
        </div>
        <div>
          <div className="font-semibold text-strava font-[family-name:var(--font-space-grotesk)]">
            {count}
          </div>
          <div className="text-[0.55rem] uppercase tracking-wider text-mist">done</div>
        </div>
      </div>

      <div className="text-[0.65rem] text-mist font-mono pt-2 border-t border-border break-all">
        {stage.tags[0]}
      </div>
    </div>
  );
}

// ──────────────── How It Works ────────────────
function HowItWorks() {
  return (
    <section className="py-20 px-6 bg-bg border-t border-border">
      <div className="max-w-[700px] mx-auto">
        <div className="text-center mb-10">
          <div className="text-[0.7rem] font-semibold tracking-[0.3em] uppercase text-brand mb-3">
            The Rules
          </div>
          <h2 className="font-[family-name:var(--font-space-grotesk)] text-3xl md:text-4xl font-bold tracking-tight text-text">
            How the Tour works
          </h2>
        </div>
        <div className="space-y-4 text-mist text-sm leading-relaxed">
          <p>
            <strong className="text-text">12 stages, one per month.</strong>{" "}
            Each month has a featured stage, but you can ride any stage at any
            time. The current month&apos;s stage is highlighted above and on
            the homepage.
          </p>
          <p>
            <strong className="text-text">Tag to claim.</strong> Add{" "}
            <strong className="text-strava">#tdm-stage-N</strong> to your
            activity name on Strava (e.g. <code>Sunset spin #tdm-stage-1</code>
            ). The site detects it within 15 minutes and credits the stage.
          </p>
          <p>
            <strong className="text-text">Four jerseys.</strong> Yellow = most
            stages. Polka dot = most cumulative elevation. Green = best
            cumulative time among multi-stage riders. White = best newcomer in
            their first 30 days.
          </p>
          <p>
            <strong className="text-text">Lanterne Rouge.</strong> The rider
            with the fewest stages still in the standings. Honored, never
            mocked. Last in standings, first in our hearts.
          </p>
          <p>
            <strong className="text-text">All-time honesty.</strong> The Tour
            resets every January 1. All-time stats persist on each rider&apos;s
            profile.
          </p>
        </div>
      </div>
    </section>
  );
}
