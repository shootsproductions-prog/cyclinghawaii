import Image from "next/image";
import { FormattedFeaturedRide } from "@/types/strava";

interface Props {
  ride: FormattedFeaturedRide;
}

export default function FeaturedRide({ ride }: Props) {
  return (
    <section className="pt-24 pb-12 px-6">
      <div className="max-w-[960px] mx-auto">
        {/* Header row — like Strava */}
        <div className="flex items-start justify-between mb-6">
          <div>
            <a
              href={ride.stravaUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="font-[family-name:var(--font-space-grotesk)] text-2xl md:text-3xl font-bold tracking-tight text-text hover:text-strava transition-colors no-underline"
            >
              {ride.name}
            </a>
            <p className="text-sm text-mist mt-1">
              {ride.date} &middot; Maui County, Hawaii
            </p>
          </div>
          <a
            href={ride.stravaUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="text-xs font-medium text-strava hover:underline shrink-0 mt-2"
          >
            View on Strava &rarr;
          </a>
        </div>

        {/* Primary stats row — inline like Strava */}
        <div className="flex flex-wrap gap-x-8 gap-y-2 mb-6 pb-6 border-b border-border">
          <Stat value={ride.distance} unit="mi" label="Distance" />
          <Stat value={ride.time} label="Moving Time" />
          <Stat value={ride.elevation} unit="ft" label="Elevation" />
          <Stat value={ride.averageSpeed} unit="mi/h" label="Avg Speed" />
        </div>

        {/* Secondary stats row */}
        <div className="flex flex-wrap gap-x-8 gap-y-2 mb-8 pb-6 border-b border-border">
          {ride.avgWatts && (
            <Stat value={`${Math.round(ride.avgWatts)}`} unit="w" label="Avg Power" />
          )}
          {ride.avgCadence && (
            <Stat value={`${Math.round(ride.avgCadence)}`} unit="rpm" label="Cadence" />
          )}
          {ride.avgHeartrate && (
            <Stat value={`${Math.round(ride.avgHeartrate)}`} unit="bpm" label="Avg HR" />
          )}
          {ride.achievements > 0 && (
            <Stat value={ride.achievements.toString()} label="Achievements" />
          )}
          <Stat value={ride.kudos.toString()} label="Kudos" />
        </div>

        {/* Route Map */}
        <a
          href={ride.stravaUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="block relative w-full aspect-[2.2/1] rounded-xl overflow-hidden border border-border mb-6 hover:shadow-lg transition-shadow"
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
            <div className="w-full h-full bg-surface flex items-center justify-center">
              <span className="text-mist text-sm">Route map</span>
            </div>
          )}
        </a>

        {/* Photos */}
        {ride.photos.length > 0 && (
          <div className="flex gap-3 overflow-x-auto pb-2">
            {ride.photos.map((photo) => {
              const url = photo.urls?.["600"] || Object.values(photo.urls)[0];
              if (!url) return null;
              return (
                <div
                  key={photo.unique_id}
                  className="flex-shrink-0 w-64 h-44 rounded-lg overflow-hidden border border-border"
                >
                  <Image
                    src={url}
                    alt={photo.caption || ride.name}
                    width={256}
                    height={176}
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

function Stat({
  value,
  unit,
  label,
}: {
  value: string;
  unit?: string;
  label: string;
}) {
  return (
    <div>
      <div className="flex items-baseline gap-1">
        <span className="font-[family-name:var(--font-space-grotesk)] text-2xl font-bold text-text">
          {value}
        </span>
        {unit && (
          <span className="text-sm text-mist">{unit}</span>
        )}
      </div>
      <div className="text-xs text-mist">{label}</div>
    </div>
  );
}
