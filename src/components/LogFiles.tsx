import Image from "next/image";
import { BlogEntry } from "@/lib/blog";
import SectionHeader from "./SectionHeader";

interface Props {
  entries: BlogEntry[];
}

export default function LogFiles({ entries }: Props) {
  if (entries.length === 0) return null;

  return (
    <section id="log" className="py-20 px-6">
      <SectionHeader
        label="Log Files"
        title="The Ride Journal"
        description="Auto-generated from Strava data. Written by a machine that wishes it could ride."
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

            {/* Blog body */}
            <div className="text-mist text-[0.95rem] leading-relaxed whitespace-pre-line">
              {entry.body}
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}
