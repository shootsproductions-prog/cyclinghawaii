import { FormattedFeaturedRide } from "@/types/strava";
import { BlogEntry } from "@/lib/blog";

interface Props {
  ride: FormattedFeaturedRide;
  featuredEntry?: BlogEntry;
}

function getFirstSentence(text: string): string {
  const trimmed = text.trim();
  // Grab the first paragraph
  const firstPara = trimmed.split(/\n\n+/)[0];
  // Then the first sentence, fall back to the paragraph itself
  const match = firstPara.match(/^.*?[.!?](?:\s|$)/);
  return (match ? match[0] : firstPara).trim();
}

const formatHMS = (sec: number) => {
  const h = Math.floor(sec / 3600);
  const m = Math.floor((sec % 3600) / 60);
  const s = sec % 60;
  if (h > 0) return `${h}:${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
  return `${m}:${String(s).padStart(2, "0")}`;
};

export default function RideDashboard({ ride, featuredEntry }: Props) {
  const a = ride.analytics;
  const w = ride.weather;
  const lauraTake = featuredEntry ? getFirstSentence(featuredEntry.body) : null;
  const sufferLabel = (() => {
    const s = a.sufferScore ?? 0;
    if (s === 0) return "—";
    if (s < 50) return "Easy";
    if (s < 100) return "Moderate";
    if (s < 150) return "Hard";
    if (s < 250) return "Extreme";
    return "Epic";
  })();
  const sufferPct = Math.min(((a.sufferScore ?? 0) / 250) * 100, 100);

  const splitDelta =
    a.firstHalfAvgPower > 0
      ? Math.round(
          ((a.secondHalfAvgPower - a.firstHalfAvgPower) / a.firstHalfAvgPower) *
            100
        )
      : 0;

  return (
    <div className="mb-10">
      <h3 className="text-xs font-semibold tracking-widest uppercase text-brand mb-3">
        Performance Dashboard
      </h3>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* EFFORT CARD */}
        <Card title="Effort" accent="#fc5200">
          <div className="flex items-baseline gap-2 mb-3">
            <span className="font-[family-name:var(--font-space-grotesk)] text-3xl font-bold text-strava">
              {a.sufferScore ?? "—"}
            </span>
            <span className="text-sm text-mist">Suffer Score</span>
            <span className="ml-auto text-xs font-semibold text-text uppercase tracking-wider">
              {sufferLabel}
            </span>
          </div>
          <div className="h-2 bg-surface rounded-full overflow-hidden mb-4">
            <div
              className="h-full bg-gradient-to-r from-brand to-strava"
              style={{ width: `${sufferPct}%` }}
            />
          </div>

          <Sub label="HR Drift" value={`${a.hrDrift > 0 ? "+" : ""}${a.hrDrift}%`} />
          <Sub
            label="Stopped Time"
            value={a.stoppedTimeSec > 0 ? formatHMS(a.stoppedTimeSec) : "0:00"}
          />
        </Card>

        {/* POWER CARD */}
        <Card title="Power" accent="#a855f7">
          <div className="grid grid-cols-3 gap-2 mb-4">
            <Stat
              big
              value={ride.avgWatts ? Math.round(ride.avgWatts).toString() : "—"}
              label="Avg"
              unit="w"
              color="#a855f7"
            />
            <Stat
              big
              value={a.normalizedPower ? a.normalizedPower.toString() : "—"}
              label="NP"
              unit="w"
              color="#a855f7"
            />
            <Stat
              big
              value={
                ride.maxStats.maxPower
                  ? Math.round(ride.maxStats.maxPower).toString()
                  : "—"
              }
              label="Max"
              unit="w"
              color="#a855f7"
            />
          </div>
          <Sub
            label="Variability Index"
            value={a.powerVariability > 0 ? a.powerVariability.toFixed(2) : "—"}
          />
          <Sub
            label="1st / 2nd Half Split"
            value={
              a.firstHalfAvgPower > 0
                ? `${a.firstHalfAvgPower}w → ${a.secondHalfAvgPower}w (${splitDelta > 0 ? "+" : ""}${splitDelta}%)`
                : "—"
            }
          />
        </Card>

        {/* HEART RATE CARD */}
        <Card title="Heart Rate" accent="#ef4444">
          <div className="grid grid-cols-3 gap-2 mb-4">
            <Stat
              big
              value={
                ride.avgHeartrate
                  ? Math.round(ride.avgHeartrate).toString()
                  : "—"
              }
              label="Avg"
              unit="bpm"
              color="#ef4444"
            />
            <Stat
              big
              value={
                ride.maxStats.maxHeartrate
                  ? Math.round(ride.maxStats.maxHeartrate).toString()
                  : "—"
              }
              label="Max"
              unit="bpm"
              color="#ef4444"
            />
            <Stat
              big
              value={`${a.hrDrift > 0 ? "+" : ""}${a.hrDrift}`}
              label="Drift"
              unit="%"
              color="#ef4444"
            />
          </div>
          {/* Mini zone bars */}
          {a.hrZones.length > 0 && (
            <div>
              <div className="text-[0.65rem] text-mist uppercase tracking-wider mb-2">
                Time in Zones
              </div>
              <div className="space-y-1.5">
                {a.hrZones.map((z) => (
                  <ZoneBar key={z.zone} zone={z.zone} pct={z.pct} />
                ))}
              </div>
            </div>
          )}
        </Card>

        {/* RHYTHM / TIMING CARD */}
        <Card title="Rhythm" accent="#0ea5e9">
          <div className="grid grid-cols-2 gap-3 mb-4">
            <Stat
              big
              value={
                ride.avgCadence ? Math.round(ride.avgCadence).toString() : "—"
              }
              label="Avg Cadence"
              unit="rpm"
              color="#0ea5e9"
            />
            <Stat
              big
              value={
                ride.maxStats.maxSpeed
                  ? ride.maxStats.maxSpeed.toFixed(1)
                  : "—"
              }
              label="Top Speed"
              unit="mph"
              color="#0ea5e9"
            />
          </div>
          <Sub
            label="Moving Time"
            value={a.movingTimeSec > 0 ? formatHMS(a.movingTimeSec) : ride.time}
          />
          <Sub
            label="Elapsed Time"
            value={a.elapsedTimeSec > 0 ? formatHMS(a.elapsedTimeSec) : "—"}
          />
        </Card>

        {/* WEATHER CARD */}
        {w && (
          <Card title="Conditions" accent="#06b6d4">
            <div className="flex items-baseline gap-2 mb-3">
              <span className="font-[family-name:var(--font-space-grotesk)] text-4xl font-bold text-text">
                {w.tempF}°
              </span>
              <span className="text-sm text-mist">{w.conditions}</span>
            </div>
            <Sub label="Wind" value={`${w.windMph} mph ${w.windDir}`} />
            <Sub label="Humidity" value={`${w.humidity}%`} />
          </Card>
        )}

        {/* LAURA'S TAKE CARD — pull-quote roast preview */}
        {lauraTake && (
          <Card title="Laura's Take" accent="#b45309">
            <div className="relative">
              <svg
                width="24"
                height="24"
                viewBox="0 0 24 24"
                fill="#b45309"
                className="opacity-20 absolute -top-1 -left-1"
                aria-hidden
              >
                <path d="M3 21c3 0 7-1 7-8V5c0-1.25-.756-2.017-2-2H4c-1.25 0-2 .75-2 1.972V11c0 1.25.75 2 2 2 1 0 1 0 1 1v1c0 1-1 2-2 2s-1 .008-1 1.031V20c0 1 0 1 1 1z" />
                <path d="M15 21c3 0 7-1 7-8V5c0-1.25-.757-2.017-2-2h-4c-1.25 0-2 .75-2 1.972V11c0 1.25.75 2 2 2h.75c0 2.25.25 4-2.75 4v3c0 1 0 1 1 1z" />
              </svg>
              <p className="italic text-text text-base leading-relaxed pl-7 pr-1">
                {lauraTake}
              </p>
              <a
                href="#log"
                className="inline-block mt-3 text-xs font-semibold text-strava uppercase tracking-wider hover:underline"
              >
                Read the full entry &darr;
              </a>
            </div>
          </Card>
        )}

        {/* BEST EFFORTS CARD */}
        {a.bestEfforts.length > 0 && (
          <Card title="Best Efforts" accent="#b45309">
            <div className="space-y-2">
              {a.bestEfforts.slice(0, 5).map((e) => (
                <div
                  key={e.name}
                  className="flex items-center justify-between text-sm"
                >
                  <div className="flex items-center gap-2">
                    <span className="text-text">{e.name}</span>
                    {e.isPR && (
                      <span className="text-[0.6rem] font-bold px-1.5 py-0.5 rounded bg-strava text-white">
                        PR
                      </span>
                    )}
                  </div>
                  <span className="font-[family-name:var(--font-space-grotesk)] font-bold text-text tabular-nums">
                    {e.time}
                  </span>
                </div>
              ))}
            </div>
          </Card>
        )}
      </div>
    </div>
  );
}

// ────── Sub-components ──────

function Card({
  title,
  accent,
  children,
}: {
  title: string;
  accent: string;
  children: React.ReactNode;
}) {
  return (
    <div className="bg-card rounded-2xl border border-border p-5 relative overflow-hidden">
      <div className="flex items-center gap-2 mb-4">
        <span
          className="w-2 h-2 rounded-full"
          style={{ backgroundColor: accent }}
        />
        <h4 className="text-xs font-semibold tracking-widest uppercase text-mist">
          {title}
        </h4>
      </div>
      {children}
    </div>
  );
}

function Stat({
  value,
  label,
  unit,
  color,
  big,
}: {
  value: string;
  label: string;
  unit?: string;
  color: string;
  big?: boolean;
}) {
  return (
    <div>
      <div className="flex items-baseline gap-1">
        <span
          className={`font-[family-name:var(--font-space-grotesk)] font-bold ${
            big ? "text-2xl" : "text-base"
          }`}
          style={{ color }}
        >
          {value}
        </span>
        {unit && <span className="text-xs text-mist">{unit}</span>}
      </div>
      <div className="text-[0.65rem] text-mist uppercase tracking-wider mt-0.5">
        {label}
      </div>
    </div>
  );
}

function Sub({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between text-xs py-1.5 border-t border-border first:border-t-0">
      <span className="text-mist">{label}</span>
      <span className="font-semibold text-text tabular-nums">{value}</span>
    </div>
  );
}

const ZONE_COLORS = ["#52b788", "#0ea5e9", "#facc15", "#f97316", "#ef4444"];
const ZONE_LABELS = ["Z1 Recovery", "Z2 Endurance", "Z3 Tempo", "Z4 Threshold", "Z5 VO2"];

function ZoneBar({ zone, pct }: { zone: number; pct: number }) {
  const color = ZONE_COLORS[zone - 1];
  const label = ZONE_LABELS[zone - 1];
  return (
    <div className="flex items-center gap-2 text-[0.65rem]">
      <span className="text-mist w-24 shrink-0">{label}</span>
      <div className="flex-1 h-2 bg-surface rounded-full overflow-hidden">
        <div
          className="h-full rounded-full"
          style={{ width: `${pct}%`, backgroundColor: color }}
        />
      </div>
      <span className="text-text font-semibold tabular-nums w-9 text-right">
        {pct}%
      </span>
    </div>
  );
}
