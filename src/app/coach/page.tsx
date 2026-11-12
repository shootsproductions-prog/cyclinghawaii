import type { Metadata } from "next";
import Link from "next/link";
import CoachTool from "@/components/coach/CoachTool";
import { Callout, Card, Eyebrow, SectionTitle, display } from "@/components/ToolUi";
import { HR_RIDE_EDGES, HR_ZONE_EDGES, POWER_RIDE_EDGES, POWER_ZONE_EDGES } from "@/lib/coach/analysis";
import { DURATION_ONLY_LOAD_PER_HOUR, FATIGUE_DAYS, FITNESS_DAYS } from "@/lib/coach/load";

export const metadata: Metadata = {
  title: "Coach — Cycling Hawaii",
  description:
    "A cycling coach that reads your rides the way a good coach watches a swing: what is working, one thing to change this week, a drill for it, and when to look again. Works from Strava or from ride files that never leave your device.",
};

const pct = (v: number) => `${Math.round(v * 100)}%`;

export default function CoachPage() {
  return (
    <main>
      <section className="pt-28 md:pt-32 pb-12 md:pb-16 px-6 bg-surface">
        <div className="max-w-[1100px] mx-auto">
          <Eyebrow className="mb-3">Coach</Eyebrow>
          <h1 className={`${display} text-4xl md:text-6xl font-bold tracking-tight text-text leading-[1.02] max-w-[17ch]`}>
            One thing to work on this week.
          </h1>
          <p className="mt-5 text-lg text-text/80 leading-relaxed max-w-[62ch]">
            A good coach does not hand you a spreadsheet. They watch, tell you what they see,
            give you one cue and a drill for it, and check again next time. This reads your
            rides the same way.
          </p>
          <div className="mt-6 flex flex-wrap gap-x-6 gap-y-2 text-sm text-text/80">
            <span><strong className="text-text">Private.</strong> Ride files are read in your browser and stay there.</span>
            <span><strong className="text-text">Yours only.</strong> Strava rides are shown to their owner and no one else.</span>
            <span><strong className="text-text">Honest.</strong> Training guidance, not medical advice.</span>
          </div>
        </div>
      </section>

      <section className="py-14 md:py-20 px-6 bg-bg">
        <div className="max-w-[1100px] mx-auto">
          <CoachTool />
        </div>
      </section>

      <section className="py-14 md:py-20 px-6 bg-surface border-t border-border">
        <div className="max-w-[1100px] mx-auto">
          <SectionTitle eyebrow="Show your work" title="How the numbers are worked out">
            Nothing here is a black box. If a number looks wrong, this is how to check it.
          </SectionTitle>
          <div className="grid gap-4 md:grid-cols-2">
            <Card>
              <h3 className="font-semibold text-text mb-2">Load: how hard was that ride?</h3>
              <p className="text-sm text-text/85 leading-relaxed">
                Every ride gets one score, where 100 means an hour at the hardest effort you
                could hold for an hour. The coach uses the best signal each ride has:
              </p>
              <ol className="mt-3 space-y-2 text-sm text-text/85 leading-relaxed list-decimal pl-5">
                <li>
                  <strong>Power</strong>, if you have a power meter and have entered your FTP:
                  hours × (normalized power ÷ FTP)² × 100. This is the Training Stress Score
                  used across cycling.
                </li>
                <li>
                  <strong>Heart rate</strong>, otherwise: each minute is weighted by how far
                  your heart rate sits between resting and maximum, with hard minutes counting
                  much more than easy ones (Banister&apos;s training impulse), scaled so an hour
                  at threshold also scores 100.
                </li>
                <li>
                  <strong>Time alone</strong>, if a ride has neither: {DURATION_ONLY_LOAD_PER_HOUR} points an hour, the
                  load of a steady endurance ride. This is a placeholder, and the page says so
                  whenever it is being used.
                </li>
              </ol>
            </Card>
            <Card>
              <h3 className="font-semibold text-text mb-2">Fitness, fatigue and form</h3>
              <ul className="space-y-2 text-sm text-text/85 leading-relaxed list-disc pl-5">
                <li>
                  <strong>Fitness</strong> is your average daily load over roughly the last six
                  weeks (an exponentially weighted average with a {FITNESS_DAYS}-day time constant).
                </li>
                <li>
                  <strong>Fatigue</strong> is the same thing over roughly the last week ({FATIGUE_DAYS}-day
                  time constant).
                </li>
                <li>
                  <strong>Form</strong> is yesterday&apos;s fitness minus yesterday&apos;s fatigue.
                  Positive means fresh. Negative means you are carrying fatigue, which is normal
                  while building and a warning sign when it is deep and stays there.
                </li>
              </ul>
              <p className="mt-3 text-sm text-text/85 leading-relaxed">
                This is the model coaches call the performance management chart. It is
                bookkeeping of what you did, not a measurement of your body. Trust the trend
                more than any single number, and trust it less when load is coming from heart
                rate or time rather than power. With under six weeks of rides, fitness reads low
                because the average has not filled in yet.
              </p>
            </Card>
            <Card>
              <h3 className="font-semibold text-text mb-2">Easy, moderate, hard</h3>
              <p className="text-sm text-text/85 leading-relaxed">
                From ride files, the split is true time in each band, second by second:
              </p>
              <ul className="mt-2 space-y-1 text-sm text-text/85 leading-relaxed list-disc pl-5">
                <li>
                  Heart rate: easy below {pct(HR_ZONE_EDGES[0])} of maximum, moderate {pct(HR_ZONE_EDGES[0])} to {pct(HR_ZONE_EDGES[1])}, hard above.
                </li>
                <li>
                  Power: easy below {pct(POWER_ZONE_EDGES[0])} of FTP, moderate up to {pct(POWER_ZONE_EDGES[1])}, hard above.
                </li>
              </ul>
              <p className="mt-3 text-sm text-text/85 leading-relaxed">
                From Strava the coach only has each ride&apos;s average, so a whole ride goes in
                one band: easy below {pct(HR_RIDE_EDGES[0])} of maximum heart rate (or {pct(POWER_RIDE_EDGES[0])} of
                FTP), hard above {pct(HR_RIDE_EDGES[1])} (or {pct(POWER_RIDE_EDGES[1])}). That is cruder: a ride with ten
                hard minutes inside two easy hours counts as easy. The page tells you which
                method it used.
              </p>
            </Card>
            <Card>
              <h3 className="font-semibold text-text mb-2">Where your data goes</h3>
              <ul className="space-y-2 text-sm text-text/85 leading-relaxed list-disc pl-5">
                <li>
                  <strong>Ride files</strong> are opened and analysed in your browser and stored
                  in your browser. They are never uploaded.
                </li>
                <li>
                  <strong>Strava rides</strong> are fetched by this site&apos;s server for the
                  rider they belong to only, as totals (time, distance, climbing, averages). No
                  routes or locations, and nothing is shown to other visitors.
                </li>
                <li>
                  <strong>The AI read</strong>, if you ask for it, sends weekly totals and the
                  headline numbers to this site&apos;s server and to Anthropic&apos;s Claude to write
                  the read. No ride names, files, routes or photos. Without it, the read is
                  written by fixed rules in your browser.
                </li>
                <li>
                  <strong>Your bike fit</strong> stays on your device. The coach reads the
                  latest session from the <Link href="/fit" className="text-strava font-semibold underline-offset-4 hover:underline">fit tool</Link> in
                  this same browser, if there is one.
                </li>
              </ul>
            </Card>
          </div>
          <div className="mt-6">
            <Callout title="A coach, not a doctor">
              This is general training guidance. It cannot see illness, injury, sleep, stress
              or the heat on the day. If you feel unwell, unusually exhausted or in pain, rest
              and talk to a professional. No plan is worth riding through that.
            </Callout>
          </div>
        </div>
      </section>
    </main>
  );
}
