import { FormattedRide } from "@/types/strava";

interface StravaCardProps {
  ride: FormattedRide;
}

export default function StravaCard({ ride }: StravaCardProps) {
  return (
    <div className="bg-basalt border border-white/5 rounded-[14px] p-6 transition-all hover:border-strava/30 hover:-translate-y-1">
      {/* Header */}
      <div className="flex justify-between items-start mb-4">
        <span className="text-[0.7rem] font-semibold tracking-widest uppercase text-strava">
          {ride.type}
        </span>
        <span className="text-xs text-ash">{ride.date}</span>
      </div>

      {/* Title */}
      <h3 className="font-[family-name:var(--font-space-grotesk)] text-lg font-semibold mb-4">
        {ride.name}
      </h3>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4">
        <div>
          <div className="font-[family-name:var(--font-space-grotesk)] text-xl font-bold text-white">
            {ride.distance}
          </div>
          <div className="text-[0.7rem] text-ash uppercase tracking-wider mt-0.5">
            Miles
          </div>
        </div>
        <div>
          <div className="font-[family-name:var(--font-space-grotesk)] text-xl font-bold text-white">
            {ride.time}
          </div>
          <div className="text-[0.7rem] text-ash uppercase tracking-wider mt-0.5">
            Time
          </div>
        </div>
        <div>
          <div className="font-[family-name:var(--font-space-grotesk)] text-xl font-bold text-white">
            {ride.elevation}
          </div>
          <div className="text-[0.7rem] text-ash uppercase tracking-wider mt-0.5">
            Elev (ft)
          </div>
        </div>
      </div>

      {/* Elevation bar */}
      <div className="mt-4 h-1 bg-lava rounded-full overflow-hidden">
        <div
          className="h-full rounded-full bg-gradient-to-r from-strava to-strava-light"
          style={{ width: `${ride.elevationPct}%` }}
        />
      </div>
    </div>
  );
}
