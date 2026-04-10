import Image from "next/image";
import { BlogEntry } from "@/lib/blog";
import SectionHeader from "./SectionHeader";

interface Props {
  entries: BlogEntry[];
  showArchiveLink?: boolean;
}

export default function LogFiles({ entries, showArchiveLink }: Props) {
  if (entries.length === 0) return null;

  return (
    <section id="log" className="py-20 px-6">
      <SectionHeader
        label="Log Files"
        title="Journal"
        description="Laura here. I read his telemetry and write the truth. He doesn't always love it."
      />

      <div className="max-w-[800px] mx-auto space-y-16">
        {entries.map((entry) => (
          <article key={entry.rideId}>
            {/* Map thumbnail */}
            {entry.mapImageUrl && (
              <a
                href={entry.stravaUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="block relative w-full aspect-[3/1] rounded-xl overflow-hidden border border-border mb-5 hover:shadow-md transition-shadow"
              >
                <Image
                  src={entry.mapImageUrl}
                  alt={`Route: ${entry.title}`}
                  fill
                  className="object-cover"
                  unoptimized
                />
              </a>
            )}

            {/* Header */}
            <div className="flex items-baseline justify-between mb-2">
              <a
                href={entry.stravaUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="font-[family-name:var(--font-space-grotesk)] text-xl font-bold text-text hover:text-strava transition-colors no-underline"
              >
                {entry.title}
              </a>
              <span className="text-xs text-mist shrink-0 ml-4">
                {entry.date}
              </span>
            </div>

            {/* Stats badge */}
            <div className="flex items-center gap-4 text-xs text-mist mb-4">
              <span className="font-semibold">{entry.distance} mi</span>
              <span>{entry.elevation} ft</span>
              <span>{entry.time}</span>
              <a
                href={entry.stravaUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="ml-auto text-strava font-medium hover:underline"
              >
                View on Strava &rarr;
              </a>
            </div>

            {/* Blog body with optional photo */}
            <div className="md:flex md:gap-6">
              {entry.photoUrl && (
                <div className="md:w-[280px] md:shrink-0 mb-4 md:mb-0">
                  <a
                    href={entry.stravaUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="block relative w-full aspect-[4/3] rounded-xl overflow-hidden border border-border hover:shadow-md transition-shadow"
                  >
                    <Image
                      src={entry.photoUrl}
                      alt={entry.title}
                      fill
                      className="object-cover"
                      unoptimized
                    />
                  </a>
                </div>
              )}
              <div className="text-mist text-[0.95rem] leading-relaxed whitespace-pre-line flex-1">
                {entry.body}
              </div>
            </div>
          </article>
        ))}
      </div>

      {showArchiveLink && entries.length >= 3 && (
        <div className="text-center mt-12">
          <a
            href="/log"
            className="inline-flex items-center gap-2 px-6 py-3 border border-border text-mist font-medium text-sm rounded-lg transition-all hover:border-strava hover:text-strava"
          >
            Read the full archive &rarr;
          </a>
        </div>
      )}
    </section>
  );
}
