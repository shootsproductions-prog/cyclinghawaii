import { FormattedStats } from "@/types/strava";

interface StravaSummaryProps {
  stats: FormattedStats;
}

const items = [
  { key: "totalMiles" as const, label: "Miles This Year" },
  { key: "totalRides" as const, label: "Rides" },
  { key: "totalElevation" as const, label: "Elev Gain (ft)" },
  { key: "avgSpeed" as const, label: "Avg Speed (mph)" },
];

export default function StravaSummary({ stats }: StravaSummaryProps) {
  return (
    <div className="max-w-[1100px] mx-auto grid grid-cols-2 md:grid-cols-4 gap-4 p-8 bg-basalt rounded-[14px] border border-white/5">
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
