import { MaxStats } from "@/types/strava";

interface Props {
  stats: MaxStats;
}

export default function MaxStatsRow({ stats }: Props) {
  const items = [
    {
      label: "Top Speed",
      value: stats.maxSpeed > 0 ? stats.maxSpeed.toFixed(1) : "—",
      unit: "mph",
      icon: (
        <path d="M13 10V3L4 14h7v7l9-11h-7z" />
      ),
      color: "#fc5200",
    },
    {
      label: "Peak HR",
      value: stats.maxHeartrate > 0 ? Math.round(stats.maxHeartrate).toString() : "—",
      unit: "bpm",
      icon: (
        <path d="M20.84 4.61a5.5 5.5 0 00-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 00-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 000-7.78z" />
      ),
      color: "#ef4444",
    },
    {
      label: "Peak Power",
      value: stats.maxPower > 0 ? Math.round(stats.maxPower).toString() : "—",
      unit: "w",
      icon: (
        <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" />
      ),
      color: "#a855f7",
    },
    {
      label: "Max Grade",
      value: stats.maxGrade > 0 ? stats.maxGrade.toFixed(1) : "—",
      unit: "%",
      icon: (
        <path d="M3 17l6-6 4 4 8-8M17 7h4v4" />
      ),
      color: "#b45309",
    },
  ];

  // Don't render if all stats are zero (e.g. fallback data)
  if (items.every((i) => i.value === "—")) return null;

  return (
    <div className="mb-8">
      <h3 className="text-xs font-semibold tracking-widest uppercase text-brand mb-3">
        Max Stats
      </h3>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {items.map((item) => (
          <div
            key={item.label}
            className="bg-surface rounded-xl border border-border p-4 relative overflow-hidden"
          >
            <div
              className="absolute top-3 right-3 opacity-20"
              style={{ color: item.color }}
            >
              <svg
                width="28"
                height="28"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                viewBox="0 0 24 24"
              >
                {item.icon}
              </svg>
            </div>
            <div className="relative">
              <div className="flex items-baseline gap-1">
                <span
                  className="font-[family-name:var(--font-space-grotesk)] text-2xl font-bold"
                  style={{ color: item.color }}
                >
                  {item.value}
                </span>
                <span className="text-xs text-mist">{item.unit}</span>
              </div>
              <div className="text-xs text-mist uppercase tracking-wider mt-1">
                {item.label}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
