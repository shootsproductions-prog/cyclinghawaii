import Image from "next/image";
import { FormattedFeaturedRide } from "@/types/strava";
import SectionHeader from "./SectionHeader";
import ElevationProfile from "./ElevationProfile";
import MetricChart from "./MetricChart";
import RideDashboard from "./RideDashboard";

interface Props {
  ride: FormattedFeaturedRide;
}

export default function FeaturedRide({ ride }: Props) {
  const w = ride.weather;
  return (
    <section id="rides" className="pt-28 pb-12 px-6">
      <SectionHeader
        label="Latest Ride"
        title="Fresh Off The Bike"
        description="Still catching his breath while this page loads."
      />

      <div className="max-w-[960px] mx-auto">
        {/* Ride header row */}
        <div className="flex items-start justify-between mb-6 gap-4">
          <div className="min-w-0">
            <a
              href={ride.stravaUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="font-[family-name:var(--font-space-grotesk)] text-2xl md:text-3xl font-bold tracking-tight text-text hover:text-strava transition-colors no-underline"
            >
              {ride.name}
            </a>
            <p className="text-sm text-mist mt-1 flex items-center gap-2 flex-wrap">
              <span>{ride.date}</span>
              <span className="text-mist/40">·</span>
              <span>Maui County, Hawaii</span>
              {w && (
                <>
                  <span className="text-mist/40">·</span>
                  <span className="inline-flex items-center gap-1">
                    <svg
                      width="12"
                      height="12"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                    >
                      <circle cx="12" cy="12" r="4" />
                      <path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M4.93 19.07l1.41-1.41M17.66 6.34l1.41-1.41" />
                    </svg>
                    {w.tempF}° {w.conditions}
                  </span>
                </>
              )}
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

        {/* Headline stats */}
        <div className="flex flex-wrap gap-x-8 gap-y-2 mb-8 pb-6 border-b border-border">
          <Stat value={ride.distance} unit="mi" label="Distance" />
          <Stat value={ride.time} label="Moving Time" />
          <Stat value={ride.elevation} unit="ft" label="Elevation" />
          <Stat value={ride.averageSpeed} unit="mi/h" label="Avg Speed" />
          {ride.calories > 0 && (
            <Stat value={ride.calories.toLocaleString()} label="Calories" />
          )}
          <Stat value={ride.kudos.toString()} label="Kudos" />
        </div>

        {/* Route Map */}
        <a
          href={ride.stravaUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="block relative w-full aspect-[2.2/1] rounded-xl overflow-hidden border border-border mb-10 hover:shadow-lg transition-shadow"
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

        {/* Performance Dashboard — the new dense info grid */}
        <RideDashboard ride={ride} />

        {/* Full-width telemetry charts */}
        <h3 className="text-xs font-semibold tracking-widest uppercase text-brand mb-3 mt-2">
          Telemetry
        </h3>
        <ElevationProfile
          points={ride.elevationProfile}
          maxElevation={ride.elevation}
          totalDistance={ride.distance}
        />
        <MetricChart
          title="Heart Rate"
          points={ride.heartrateProfile}
          unit="bpm"
          colorFrom="#ef4444"
          colorTo="#ef4444"
          lineColor="#ef4444"
          summaryLabel="Avg"
          summaryValue={
            ride.avgHeartrate ? `${Math.round(ride.avgHeartrate)} bpm` : undefined
          }
        />
        <MetricChart
          title="Power"
          points={ride.powerProfile}
          unit="w"
          colorFrom="#a855f7"
          colorTo="#a855f7"
          lineColor="#a855f7"
          summaryLabel="Avg"
          summaryValue={
            ride.avgWatts ? `${Math.round(ride.avgWatts)} w` : undefined
          }
        />

        {/* Photos */}
        {ride.photos.length > 0 && (
          <div className="mt-2">
            <h3 className="text-xs font-semibold tracking-widest uppercase text-brand mb-3">
              Photos
            </h3>
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
        {unit && <span className="text-sm text-mist">{unit}</span>}
      </div>
      <div className="text-xs text-mist">{label}</div>
    </div>
  );
}
