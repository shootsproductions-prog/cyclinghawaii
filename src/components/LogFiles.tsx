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

      <div className="max-w-[720px] mx-auto space-y-12">
        {entries.map((entry) => (
          <article key={entry.rideId} className="border-b border-border pb-10">
            <div className="flex items-baseline justify-between mb-4">
              <h3 className="font-[family-name:var(--font-space-grotesk)] text-xl font-bold text-text">
                {entry.title}
              </h3>
              <span className="text-xs text-mist shrink-0 ml-4">
                {entry.date}
              </span>
            </div>
            <div className="text-mist text-[0.95rem] leading-relaxed whitespace-pre-line">
              {entry.body}
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}
