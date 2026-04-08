import Image from "next/image";
import { FormattedRide } from "@/types/strava";

interface Props {
  ride: FormattedRide;
}

export default function StravaCard({ ride }: Props) {
  return (
    <div className="bg-card border border-border rounded-2xl shadow-sm hover:shadow-md hover:-translate-y-1 transition-all overflow-hidden">
      {/* Mini Map */}
      {ride.mapImageUrl ? (
        <div className="relative w-full aspect-[2/1]">
          <Image
            src={ride.mapImageUrl}
            alt={`Route: ${ride.name}`}
            fill
            className="object-cover"
            unoptimized
          />
        </div>
      ) : (
        <div className="w-full aspect-[2/1] bg-surface" />
      )}

      {/* Card Body */}
      <div className="p-5">
        <div className="flex justify-between items-start mb-3">
          <span className="text-[0.7rem] font-semibold tracking-widest uppercase text-strava">
            {ride.type}
          </span>
          <span className="text-xs text-mist">{ride.date}</span>
        </div>

        <h3 className="font-[family-name:var(--font-space-grotesk)] text-lg font-semibold text-text mb-3">
          {ride.name}
        </h3>

        <div className="grid grid-cols-3 gap-3 mb-3">
          <div>
            <div className="font-[family-name:var(--font-space-grotesk)] text-lg font-bold text-text">
              {ride.distance}
            </div>
            <div className="text-[0.65rem] text-mist uppercase tracking-wider">
              Miles
            </div>
          </div>
          <div>
            <div className="font-[family-name:var(--font-space-grotesk)] text-lg font-bold text-text">
              {ride.time}
            </div>
            <div className="text-[0.65rem] text-mist uppercase tracking-wider">
              Time
            </div>
          </div>
          <div>
            <div className="font-[family-name:var(--font-space-grotesk)] text-lg font-bold text-text">
              {ride.elevation}
            </div>
            <div className="text-[0.65rem] text-mist uppercase tracking-wider">
              Elev (ft)
            </div>
          </div>
        </div>

        {/* Engagement */}
        <div className="flex items-center gap-4 text-xs text-mist pt-3 border-t border-border">
          <span className="flex items-center gap-1">
            <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24">
              <path d="M14 9V5a3 3 0 00-6 0v4M5 11h14l-1 9H6l-1-9z" />
            </svg>
            {ride.kudos}
          </span>
          <span className="flex items-center gap-1">
            <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24">
              <path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z" />
            </svg>
            {ride.comments}
          </span>
          {ride.calories > 0 && (
            <span className="ml-auto">{ride.calories.toLocaleString()} cal</span>
          )}
        </div>
      </div>
    </div>
  );
}
