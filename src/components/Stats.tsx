import { StatsSummary } from "@/types/strava";
import SectionHeader from "./SectionHeader";

interface Props {
  stats: StatsSummary;
}

function format(n: number): string {
  return n.toLocaleString();
}

function paceVerdict(ytd: number, goal: number, pace: number): string {
  if (goal <= 0) return "";
  const pct = (ytd / goal) * 100;
  if (pct >= 100) return "Goal already crushed.";
  if (pace >= goal) return "On pace to hit it.";
  const shortBy = goal - pace;
  return `Off pace by ${format(Math.round(shortBy))} miles.`;
}

export default function Stats({ stats }: Props) {
  const goalPct = Math.min(
    Math.round((stats.ytdMiles / Math.max(stats.yearGoal, 1)) * 100),
    100
  );
  const verdict = paceVerdict(stats.ytdMiles, stats.yearGoal, stats.paceMiles);

  return (
    <section id="stats" className="py-20 px-6 bg-surface">
      <SectionHeader
        label="By the Numbers"
        title="Year of Vini"
        description="Every mile, every foot, every record. The data doesn't lie. He's still got work to do."
      />

      <div className="max-w-[1000px] mx-auto">
        {/* Year Goal hero */}
        <div className="bg-card border border-border rounded-2xl p-6 md:p-8 mb-6 shadow-sm">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-xs font-semibold tracking-widest uppercase text-brand">
              Year Goal
            </h3>
            <span className="text-xs text-mist">
              {new Date().getFullYear()}
            </span>
          </div>

          <div className="flex items-end justify-between mb-4 flex-wrap gap-2">
            <div>
              <span className="font-[family-name:var(--font-space-grotesk)] text-5xl md:text-6xl font-bold text-strava">
                {format(stats.ytdMiles)}
              </span>
              <span className="text-mist text-lg ml-2">
                / {format(stats.yearGoal)} miles
              </span>
            </div>
            <span className="font-[family-name:var(--font-space-grotesk)] text-2xl font-bold text-text">
              {goalPct}%
            </span>
          </div>

          <div className="h-3 bg-surface rounded-full overflow-hidden mb-4">
            <div
              className="h-full rounded-full bg-gradient-to-r from-brand to-strava transition-all"
              style={{ width: `${goalPct}%` }}
            />
          </div>

          {stats.paceMiles > 0 && (
            <div className="flex items-center justify-between text-sm flex-wrap gap-2">
              <span className="text-mist">
                On current pace:{" "}
                <span className="font-semibold text-text">
                  {format(stats.paceMiles)} miles
                </span>{" "}
                by Dec 31
              </span>
              <span
                className={`text-xs italic ${
                  stats.paceMiles >= stats.yearGoal
                    ? "text-text"
                    : "text-mist"
                }`}
              >
                {verdict}
              </span>
            </div>
          )}
        </div>

        {/* Time Horizons */}
        <h3 className="text-xs font-semibold tracking-widest uppercase text-brand mb-3">
          Time Horizons
        </h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-8">
          <Horizon
            label="This Month"
            primary={`${stats.monthMiles}`}
            primaryUnit="mi"
            rows={[
              { label: "Rides", value: format(stats.monthRides) },
              {
                label: "Climbed",
                value: `${format(stats.monthElevationFt)} ft`,
              },
              { label: "Time", value: `${stats.monthHours} hr` },
            ]}
          />
          <Horizon
            label="Last 4 Weeks"
            primary={format(stats.recentMiles)}
            primaryUnit="mi"
            rows={[
              { label: "Rides", value: format(stats.recentRides) },
              {
                label: "Climbed",
                value: `${format(stats.recentElevationFt)} ft`,
              },
            ]}
          />
          <Horizon
            label="Year to Date"
            primary={format(stats.ytdMiles)}
            primaryUnit="mi"
            rows={[
              { label: "Rides", value: format(stats.ytdRides) },
              {
                label: "Climbed",
                value: `${format(stats.ytdElevationFt)} ft`,
              },
              {
                label: "Avg Speed",
                value: `${stats.ytdAvgSpeed} mph`,
              },
            ]}
          />
          <Horizon
            label="All Time"
            primary={format(stats.lifetimeMiles)}
            primaryUnit="mi"
            rows={[
              { label: "Rides", value: format(stats.lifetimeRides) },
              {
                label: "Climbed",
                value: `${format(stats.lifetimeElevationFt)} ft`,
              },
            ]}
          />
        </div>

        {/* Records */}
        <h3 className="text-xs font-semibold tracking-widest uppercase text-brand mb-3">
          Lifetime Records
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <Record
            label="Biggest Ride"
            value={
              stats.biggestRideMiles > 0
                ? `${stats.biggestRideMiles}`
                : "—"
            }
            unit="miles"
            color="#fc5200"
            iconPath="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3"
          />
          <Record
            label="Biggest Climb"
            value={
              stats.biggestClimbFt > 0
                ? format(stats.biggestClimbFt)
                : "—"
            }
            unit="feet"
            color="#b45309"
            iconPath="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6"
          />
          <Record
            label="Longest Streak"
            value={
              stats.longestStreakDays > 0
                ? `${stats.longestStreakDays}`
                : "—"
            }
            unit="days"
            color="#ef4444"
            iconPath="M12 2c1.5 4 6 5 6 11a6 6 0 11-12 0c0-3 2-4 2-7 1.5 1 3 1 4-4z"
          />
        </div>
      </div>
    </section>
  );
}

// ────── Sub-components ──────

function Horizon({
  label,
  primary,
  primaryUnit,
  rows,
}: {
  label: string;
  primary: string;
  primaryUnit: string;
  rows: { label: string; value: string }[];
}) {
  return (
    <div className="bg-card rounded-xl border border-border p-4">
      <div className="text-[0.6rem] font-semibold text-mist uppercase tracking-widest mb-2">
        {label}
      </div>
      <div className="flex items-baseline gap-1 mb-3">
        <span className="font-[family-name:var(--font-space-grotesk)] text-2xl font-bold text-text">
          {primary}
        </span>
        <span className="text-xs text-mist">{primaryUnit}</span>
      </div>
      <div className="space-y-1.5">
        {rows.map((r) => (
          <div
            key={r.label}
            className="flex items-center justify-between text-xs"
          >
            <span className="text-mist">{r.label}</span>
            <span className="font-semibold text-text tabular-nums">
              {r.value}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

function Record({
  label,
  value,
  unit,
  color,
  iconPath,
}: {
  label: string;
  value: string;
  unit: string;
  color: string;
  iconPath: string;
}) {
  return (
    <div className="bg-card rounded-xl border border-border p-5 relative overflow-hidden">
      <div
        className="absolute top-3 right-3 opacity-15"
        style={{ color }}
      >
        <svg
          width="36"
          height="36"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeLinejoin="round"
          viewBox="0 0 24 24"
        >
          <path d={iconPath} />
        </svg>
      </div>
      <div className="relative">
        <div className="text-[0.65rem] font-semibold text-mist uppercase tracking-widest mb-2">
          {label}
        </div>
        <div className="flex items-baseline gap-2">
          <span
            className="font-[family-name:var(--font-space-grotesk)] text-3xl font-bold"
            style={{ color }}
          >
            {value}
          </span>
          <span className="text-sm text-mist">{unit}</span>
        </div>
      </div>
    </div>
  );
}
