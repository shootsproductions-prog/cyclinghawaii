import { FormattedStats } from "@/types/strava";

interface Props {
  stats: FormattedStats;
}

const items = [
  { key: "totalMiles" as const, label: "Miles This Year" },
  { key: "totalRides" as const, label: "Rides" },
  { key: "totalElevation" as const, label: "Elev Gain (ft)" },
  { key: "avgSpeed" as const, label: "Avg Speed (mph)" },
];

export default function StravaSummary({ stats }: Props) {
  return (
    <div className="max-w-[1200px] mx-auto grid grid-cols-2 md:grid-cols-4 gap-4 p-8 bg-card rounded-2xl border border-border shadow-sm">
      {items.map((item) => (
        <div key={item.key} className="text-center">
          <div className="font-[family-name:var(--font-space-grotesk)] text-3xl font-bold bg-gradient-to-br from-brand to-strava bg-clip-text text-transparent">
            {stats[item.key]}
          </div>
          <div className="text-xs text-mist uppercase tracking-wider mt-1">
            {item.label}
          </div>
        </div>
      ))}
    </div>
  );
}
