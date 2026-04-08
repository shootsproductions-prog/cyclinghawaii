import Image from "next/image";
import { FormattedFeaturedRide } from "@/types/strava";

interface Props {
  ride: FormattedFeaturedRide;
}

export default function FeaturedRide({ ride }: Props) {
  return (
    <section className="pt-28 pb-16 px-6">
      <div className="max-w-[1200px] mx-auto">
        {/* Route Map */}
        <a
          href={ride.stravaUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="block relative w-full aspect-[2/1] rounded-2xl overflow-hidden border border-border shadow-lg mb-8 hover:shadow-xl transition-shadow"
        >
          {ride.largeMapImageUrl ? (
            <Image
              src={ride.largeMapImageUrl}
              alt={`Route map: ${ride.name}`}
              fill
              className="object-cover"
              priority
              unoptimized
            />
          ) : (
            <div className="w-full h-full bg-gradient-to-br from-surface to-border flex items-center justify-center">
              <span className="text-mist text-sm">Route map</span>
            </div>
          )}
        </a>

        {/* Ride Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <span className="text-xs font-semibold tracking-widest uppercase text-strava">
              Latest Ride
            </span>
            <span className="text-xs text-mist">{ride.date}</span>
          </div>
          <a
            href={ride.stravaUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="font-[family-name:var(--font-space-grotesk)] text-3xl md:text-5xl font-bold tracking-tight text-text hover:text-strava transition-colors no-underline"
          >
            {ride.name}
          </a>
          <a
            href={ride.stravaUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-block mt-3 text-sm font-medium text-strava hover:underline"
          >
            View on Strava &rarr;
          </a>
        </div>

        {/* Metrics Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <Metric value={ride.distance} label="Miles" accent />
          <Metric value={ride.time} label="Time" />
          <Metric value={ride.elevation} label="Elevation (ft)" />
          <Metric value={ride.averageSpeed} label="Avg Speed (mph)" />
          <Metric value={ride.calories.toLocaleString()} label="Calories" />
          <Metric value={ride.kudos.toString()} label="Kudos" />
          <Metric value={ride.comments.toString()} label="Comments" />
          <Metric value={ride.achievements.toString()} label="Achievements" />
        </div>

        {/* Heart rate row (if available) */}
        {ride.avgHeartrate && (
          <div className="flex gap-6 mb-8">
            <div>
              <span className="font-[family-name:var(--font-space-grotesk)] text-xl font-bold text-strava">
                {Math.round(ride.avgHeartrate)}
              </span>
              <span className="text-xs text-mist ml-1">avg bpm</span>
            </div>
          </div>
        )}

        {/* Photos */}
        {ride.photos.length > 0 && (
          <div className="flex gap-3 overflow-x-auto pb-4 -mx-6 px-6">
            {ride.photos.map((photo) => {
              const url = photo.urls?.["600"] || Object.values(photo.urls)[0];
              if (!url) return null;
              return (
                <div
                  key={photo.unique_id}
                  className="flex-shrink-0 w-64 h-48 rounded-xl overflow-hidden border border-border"
                >
                  <Image
                    src={url}
                    alt={photo.caption || ride.name}
                    width={256}
                    height={192}
                    className="w-full h-full object-cover"
                    unoptimized
                  />
                </div>
              );
            })}
          </div>
        )}
      </div>
    </section>
  );
}

function Metric({
  value,
  label,
  accent,
}: {
  value: string;
  label: string;
  accent?: boolean;
}) {
  return (
    <div className="bg-surface rounded-xl p-4 border border-border">
      <div
        className={`font-[family-name:var(--font-space-grotesk)] text-2xl font-bold ${
          accent ? "text-strava" : "text-text"
        }`}
      >
        {value}
      </div>
      <div className="text-xs text-mist uppercase tracking-wider mt-1">
        {label}
      </div>
    </div>
  );
}
