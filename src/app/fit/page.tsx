import type { Metadata } from "next";
import Link from "next/link";
import FitTool from "@/components/fit/FitTool";
import { Callout, Card, Eyebrow, SectionTitle, display } from "@/components/ToolUi";
import { formatRange } from "@/lib/fit/assess";
import {
  MEASUREMENT_ORDER,
  SOURCES,
  SPECS,
  STYLES,
  TOLERANCE_DEG,
  type SourceId,
} from "@/lib/fit/ranges";
import type { RidingStyle } from "@/lib/fit/types";

export const metadata: Metadata = {
  title: "Bike Fit — Cycling Hawaii",
  description:
    "A bike fit the way a tennis or golf coach teaches a swing: film yourself on the rollers, see the lines, get one change to make, then film again. Runs entirely on your device.",
};

const SHOT_LIST: { title: string; body: string }[] = [
  {
    title: "Side-on, drive side",
    body: "Camera square to the bike on the chain side, aimed at the bottom bracket. Not from the front quarter, not from behind.",
  },
  {
    title: "Level, at hip height",
    body: "Prop the phone on a stool or tripod about as high as your saddle. Use the grid in your camera app to keep it level.",
  },
  {
    title: "Far enough back",
    body: "Three to four big steps away, so the whole rider and both wheels fit with room to spare. Zooming in from further back is better than standing close.",
  },
  {
    title: "Good, even light",
    body: "Light on the side of you the camera sees. A window behind you turns you into a silhouette.",
  },
  {
    title: "Fitted clothing",
    body: "Bibs and a jersey, not a loose T-shirt. Roll up a baggy sleeve. The camera has to see where your joints are.",
  },
  {
    title: "Stickers help",
    body: "Optional but worth it: a bright dot of tape on the shoulder, elbow, wrist, hip bone, outside of the knee and ankle bone.",
  },
  {
    title: "Warm up first",
    body: "Ride ten minutes before you film. A cold body sits differently from the one that does the riding.",
  },
  {
    title: "Hands on the hoods, normal effort",
    body: "Ride the way you ride for hours, at an effort you could hold. Then record 20 to 30 seconds of steady pedalling.",
  },
];

function ShotDiagram() {
  return (
    <svg
      viewBox="0 0 520 250"
      className="w-full h-auto"
      role="img"
      aria-label="Seen from above: the bike on rollers, with the camera three to four metres away, square to the bike on the chain side and aimed at the cranks."
    >
      <rect x="0" y="0" width="520" height="250" rx="12" fill="#f5f5f5" />
      {/* Rollers */}
      <rect x="110" y="42" width="300" height="46" rx="6" fill="#e5e5e5" />
      {/* Bike from above */}
      <line x1="135" y1="65" x2="385" y2="65" stroke="#1a1a1a" strokeWidth="6" strokeLinecap="round" />
      <line x1="345" y1="48" x2="345" y2="82" stroke="#1a1a1a" strokeWidth="5" strokeLinecap="round" />
      <ellipse cx="240" cy="65" rx="26" ry="15" fill="#fc5200" />
      <circle cx="275" cy="65" r="10" fill="#1a1a1a" />
      <text x="260" y="30" textAnchor="middle" fontSize="13" fill="#666666">
        bike on rollers, seen from above
      </text>
      <text x="398" y="69" fontSize="12" fill="#666666">front</text>
      {/* Sight line */}
      <line x1="260" y1="92" x2="260" y2="190" stroke="#b45309" strokeWidth="2" strokeDasharray="6 5" />
      <path d="M 252 100 L 260 90 L 268 100" fill="none" stroke="#b45309" strokeWidth="2" />
      <text x="272" y="146" fontSize="13" fill="#b45309" fontWeight="600">
        3 to 4 m, square to the bike
      </text>
      {/* Right-angle mark */}
      <path d="M 260 104 L 274 104 L 274 92" fill="none" stroke="#b45309" strokeWidth="1.5" />
      {/* Camera */}
      <rect x="240" y="192" width="40" height="26" rx="5" fill="#1a1a1a" />
      <circle cx="260" cy="205" r="7" fill="#f5f5f5" />
      <text x="260" y="238" textAnchor="middle" fontSize="13" fill="#1a1a1a" fontWeight="600">
        camera at hip height, chain side
      </text>
    </svg>
  );
}

function RangeTable() {
  const styles = Object.keys(STYLES) as RidingStyle[];
  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[560px] border-collapse text-sm">
        <thead>
          <tr className="text-xs text-mist text-left">
            <th scope="col" className="py-2 pr-3 font-medium">Measurement</th>
            {styles.map((s) => (
              <th key={s} scope="col" className="py-2 pr-3 font-medium whitespace-nowrap">
                {STYLES[s].label}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {MEASUREMENT_ORDER.map((id) => {
            const spec = SPECS[id];
            return (
              <tr key={id} className="border-t border-border align-top">
                <th scope="row" className="py-2.5 pr-3 text-left font-normal">
                  <div className="font-semibold text-text">
                    {spec.label}
                    {spec.informational && <span className="font-normal text-mist"> (reference only)</span>}
                  </div>
                  <div className="text-xs text-mist leading-snug max-w-[46ch]">{spec.note}</div>
                </th>
                {styles.map((s) => (
                  <td key={s} className="py-2.5 pr-3 tabular-nums whitespace-nowrap text-text/90">
                    {formatRange(spec.ranges[s], spec.unit)}
                  </td>
                ))}
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

export default function FitPage() {
  const sourceIds = Object.keys(SOURCES) as SourceId[];
  return (
    <main>
      {/* ───────────── Hero ───────────── */}
      <section className="pt-28 md:pt-32 pb-12 md:pb-16 px-6 bg-surface">
        <div className="max-w-[1100px] mx-auto">
          <Eyebrow className="mb-3">Bike Fit</Eyebrow>
          <h1 className={`${display} text-4xl md:text-6xl font-bold tracking-tight text-text leading-[1.02] max-w-[16ch]`}>
            Fit your bike the way a coach fixes a swing.
          </h1>
          <p className="mt-5 text-lg text-text/80 leading-relaxed max-w-[62ch]">
            A tennis or golf coach films you, draws lines over your body, gives you one thing to
            work on, and films you again. This does the same for you on the rollers: shoot from
            the side, see your joint angles, get one change to make to the bike, then re-shoot
            and compare.
          </p>
          <div className="mt-6 flex flex-wrap gap-x-6 gap-y-2 text-sm text-text/80">
            <span><strong className="text-text">Private.</strong> Photos and video stay on your device. Nothing is uploaded.</span>
            <span><strong className="text-text">Free.</strong> No account.</span>
            <span><strong className="text-text">Honest.</strong> A guide, not a medical fitting.</span>
          </div>
        </div>
      </section>

      {/* ───────────── Step 1: the shot ───────────── */}
      <section className="py-14 md:py-20 px-6 bg-bg">
        <div className="max-w-[1100px] mx-auto">
          <SectionTitle eyebrow="Step 1" title="Set up the shot">
            The measurements are only as good as the picture. Two minutes here saves you
            chasing numbers that are really the camera&apos;s fault.
          </SectionTitle>
          <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_minmax(0,420px)] items-start">
            <ol className="grid gap-3 sm:grid-cols-2 list-none">
              {SHOT_LIST.map((item, i) => (
                <li key={item.title} className="bg-card border border-border rounded-xl p-4">
                  <div className="flex items-baseline gap-2">
                    <span className={`${display} text-strava font-bold`}>{String(i + 1).padStart(2, "0")}</span>
                    <span className="font-semibold text-text">{item.title}</span>
                  </div>
                  <p className="mt-1 text-sm text-mist leading-relaxed">{item.body}</p>
                </li>
              ))}
            </ol>
            <div className="space-y-4">
              <ShotDiagram />
              <Callout title="Video beats photos">
                Catching the exact bottom of the pedal stroke in a still photo while you balance
                on rollers is nearly impossible. Record a short video instead, then step through
                it here frame by frame and pick the three moments: pedal at the bottom (6
                o&apos;clock), pedal forward (3 o&apos;clock) and pedal at the top (12 o&apos;clock).
              </Callout>
            </div>
          </div>
        </div>
      </section>

      {/* ───────────── Steps 2 to 5: the tool ───────────── */}
      <section className="py-14 md:py-20 px-6 bg-surface border-y border-border">
        <div className="max-w-[1100px] mx-auto">
          <FitTool />
        </div>
      </section>

      {/* ───────────── Honesty ───────────── */}
      <section className="py-14 md:py-20 px-6 bg-bg">
        <div className="max-w-[1100px] mx-auto">
          <SectionTitle eyebrow="Read this" title="What a photo can and cannot tell you" />
          <div className="grid gap-4 md:grid-cols-2">
            <Card>
              <h3 className="font-semibold text-text mb-2">Where the error comes from</h3>
              <ul className="space-y-2 text-sm text-text/85 leading-relaxed list-disc pl-5">
                <li>
                  <strong>Camera angle.</strong> A camera that is not square to the bike shortens
                  everything it sees at an angle and changes every reading. A tilted camera
                  skews torso angle and the knee-over-pedal number most.
                </li>
                <li>
                  <strong>Lens distortion.</strong> Phone lenses bend straight lines near the
                  edges, most of all on the wide setting. Stand back and keep the rider in the
                  middle of the frame.
                </li>
                <li>
                  <strong>Clothing and guesswork.</strong> A point placed on fabric is not a point
                  placed on bone. The hip is the hardest to find and moves the knee and hip
                  angles the most.
                </li>
                <li>
                  <strong>One side, two dimensions.</strong> This sees one leg from the side. It
                  cannot see knees tracking in or out, a hip dropping, or a difference between
                  your left and right.
                </li>
              </ul>
              <p className="mt-3 text-sm text-text/85 leading-relaxed">
                Put together, expect each angle to be good to about {TOLERANCE_DEG} degrees either
                way, at best. That is why the tool will not ask you to change anything for a
                number that is only just outside its range.
              </p>
            </Card>
            <Card>
              <h3 className="font-semibold text-text mb-2">When to see a person instead</h3>
              <p className="text-sm text-text/85 leading-relaxed">
                This is general guidance for comfortable riding. It is not medical advice and it
                is not a substitute for a professional bike fit.
              </p>
              <ul className="mt-3 space-y-2 text-sm text-text/85 leading-relaxed list-disc pl-5">
                <li>
                  If you have pain, numbness, an injury, a leg-length difference or a history of
                  knee, hip or back trouble, see a professional fitter or a physiotherapist who
                  works with cyclists. Do not try to fix pain by chasing numbers here.
                </li>
                <li>
                  The ranges are averages across many riders. Your body is allowed to be
                  different. If a position is in range but hurts, the position is wrong for you.
                  If it is a little out of range and you have ridden it happily for years, leave it.
                </li>
                <li>
                  Make one small change at a time and give your body a few rides to answer. Stop
                  and go back if a change brings new discomfort.
                </li>
              </ul>
            </Card>
          </div>
        </div>
      </section>

      {/* ───────────── Ranges and sources ───────────── */}
      <section className="py-14 md:py-20 px-6 bg-surface border-t border-border">
        <div className="max-w-[1100px] mx-auto">
          <SectionTitle eyebrow="Show your work" title="The ranges, and where they come from">
            Targets for frames taken while pedalling, with hands on the hoods. A posed, stationary
            photo uses 25 to 35 degrees for the knee at the bottom instead.
          </SectionTitle>
          <Card>
            <RangeTable />
          </Card>

          <div className="mt-6 grid gap-4 md:grid-cols-2">
            <Callout title="Pedalling and posed numbers are not the same">
              Most published knee ranges (25 to 35 degrees) were measured with a goniometer on a
              rider sitting still. The same rider measured from video while actually pedalling
              reads several degrees more bent: one study found about 8 degrees at the knee, 5 at
              the hip and 9 at the ankle. So this tool uses 30 to 40 degrees for pedalling frames,
              and asks you which kind of frame you took.
            </Callout>
            <Callout title="How solid is the evidence?">
              Good for saddle height: the knee angle at the bottom of the stroke has been studied
              for decades. Thin for the hip, shoulder and elbow, where the bands above are fitter
              convention and deliberately wide. Knee over the pedal axle is a traditional starting
              reference that has never been shown to matter as a rule.
            </Callout>
          </div>

          <h3 className="font-semibold text-text mt-8 mb-3">Sources</h3>
          <ol className="space-y-3 text-sm text-text/85 leading-relaxed list-decimal pl-5">
            {sourceIds.map((id) => {
              const source = SOURCES[id];
              return (
                <li key={id}>
                  {source.url ? (
                    <a
                      href={source.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-text underline decoration-border underline-offset-4 hover:decoration-strava"
                    >
                      {source.citation}
                    </a>
                  ) : (
                    <span className="text-text">{source.citation}</span>
                  )}
                  <span className="block text-mist">{source.used}</span>
                </li>
              );
            })}
          </ol>
          <p className="mt-6 text-sm text-mist leading-relaxed max-w-[75ch]">
            Pose detection uses Google&apos;s MediaPipe Pose Landmarker, running in your browser
            from files served by this site. Got your position sorted? The{" "}
            <Link href="/coach" className="text-strava font-semibold underline-offset-4 hover:underline">
              Coach
            </Link>{" "}
            looks at your riding the same way: observe, one cue, re-check.
          </p>
        </div>
      </section>
    </main>
  );
}
