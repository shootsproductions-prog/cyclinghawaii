import type { Metadata } from "next";
import { getStravaData } from "@/lib/strava";
import { generateBlogEntries } from "@/lib/blog";
import LogFiles from "@/components/LogFiles";

export const metadata: Metadata = {
  title: "Log Files — Cycling Hawaii",
  description:
    "The complete ride journal. Every ride Vini has ever documented, narrated by AI with questionable comedic timing.",
};

export const revalidate = 3600;

export default async function LogArchivePage() {
  const { featured, rides } = await getStravaData();
  const allEntries = await generateBlogEntries(featured, rides);

  return (
    <main className="pt-24 pb-20">
      <div className="text-center mb-16 px-6">
        <div className="text-xs font-semibold tracking-[0.2em] uppercase text-brand mb-3">
          Archive
        </div>
        <h1 className="font-[family-name:var(--font-space-grotesk)] text-4xl md:text-5xl font-bold tracking-tight text-text mb-4">
          Journal
        </h1>
        <p className="text-mist max-w-md mx-auto">
          Every ride. Every story. Laura reads the data and writes the truth.
          Sometimes with receipts.
        </p>
        <p className="text-mist/60 text-xs mt-2">
          {allEntries.length} {allEntries.length === 1 ? "entry" : "entries"} and counting
        </p>
      </div>

      <LogFiles entries={allEntries} />
    </main>
  );
}
