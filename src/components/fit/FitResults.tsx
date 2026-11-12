"use client";

// The coach's read of a session: one change, what it should feel
// like, what to watch for, then the numbers behind it.

import { Badge, Callout, Card, Eyebrow, display, type Tone } from "@/components/ToolUi";
import type { Analysis } from "@/lib/fit/analyze";
import { formatRange, formatValue } from "@/lib/fit/assess";
import { SPECS, STYLES } from "@/lib/fit/ranges";
import type { Finding, Recommendation, SessionSettings } from "@/lib/fit/types";

const STEP_NAME: Record<Recommendation["step"], string> = {
  1: "Step 1 of 3 · Saddle height",
  2: "Step 2 of 3 · Saddle fore-aft",
  3: "Step 3 of 3 · Reach and bar height",
};

const STATUS: Record<Finding["status"], { tone: Tone; label: string }> = {
  "in-range": { tone: "good", label: "In range" },
  borderline: { tone: "warn", label: "At the edge" },
  out: { tone: "bad", label: "Out of range" },
};

function Part({ title, children }: { title: string; children: string }) {
  return (
    <div>
      <div className="text-xs font-semibold uppercase tracking-widest text-mist mb-1">{title}</div>
      <p className="text-text/90 text-[0.95rem] leading-relaxed">{children}</p>
    </div>
  );
}

function PrimaryChange({ rec }: { rec: Recommendation }) {
  return (
    <Card className="border-strava/40 shadow-sm" data-testid="primary-recommendation">
      <div className="text-xs font-semibold uppercase tracking-widest text-strava mb-2">
        {STEP_NAME[rec.step]}
      </div>
      <h3 className={`${display} text-2xl md:text-3xl font-bold tracking-tight text-text mb-5`}>
        {rec.title}
      </h3>
      <div className="grid gap-5 md:grid-cols-2">
        <Part title="What I see">{rec.observation}</Part>
        <Part title="The change">{rec.change}</Part>
        <Part title="What it should feel like">{rec.feel}</Part>
        <Part title="Watch for">{rec.watch}</Part>
      </div>
      <div className="mt-5 pt-4 border-t border-border">
        <Part title="Then re-shoot">{rec.reshoot}</Part>
      </div>
    </Card>
  );
}

function MeasurementRow({ finding }: { finding: Finding }) {
  const spec = SPECS[finding.id];
  const status = STATUS[finding.status];
  return (
    <tr className="border-t border-border align-top" data-measurement={finding.id}>
      <th scope="row" className="py-3 pr-3 text-left font-normal">
        <div className="font-semibold text-text text-sm">{finding.label}</div>
        <div className="text-xs text-mist leading-snug mt-0.5 max-w-[34ch]">{spec.meaning}</div>
      </th>
      <td className="py-3 pr-3 text-right tabular-nums whitespace-nowrap">
        <span className={`${display} text-lg font-bold text-text`} data-testid={`value-${finding.id}`}>
          {formatValue(finding.value, finding.unit)}
        </span>
      </td>
      <td className="py-3 pr-3 text-right text-sm text-mist tabular-nums whitespace-nowrap">
        {formatRange(finding.range, finding.unit)}
      </td>
      <td className="py-3 text-right">
        {finding.informational ? <Badge>Reference</Badge> : <Badge tone={status.tone}>{status.label}</Badge>}
      </td>
    </tr>
  );
}

export default function FitResults({
  analysis,
  settings,
}: {
  analysis: Analysis;
  settings: SessionSettings;
}) {
  const { plan, findings } = analysis;
  const judged = findings.filter((f) => !f.informational);
  const reference = findings.filter((f) => f.informational);

  if (findings.length === 0) {
    return (
      <Callout title="Nothing to read yet">
        Add a frame and mark the rider&apos;s joints. The bottom-of-stroke frame alone is enough
        to check saddle height, which is always the first thing to get right.
      </Callout>
    );
  }

  return (
    <div className="space-y-6" data-testid="fit-results">
      <div>
        <Eyebrow className="mb-2">The coach&apos;s read</Eyebrow>
        <p className={`${display} text-xl md:text-2xl font-bold tracking-tight text-text`} data-testid="fit-headline">
          {plan.headline}
        </p>
      </div>

      {plan.notes.length > 0 && (
        <Callout tone="warn" title="About this reading">
          <ul className="list-disc pl-5 space-y-1">
            {plan.notes.map((note) => (
              <li key={note}>{note}</li>
            ))}
          </ul>
        </Callout>
      )}

      {plan.primary && <PrimaryChange rec={plan.primary} />}

      {plan.onDeck.length > 0 && (
        <Card className="bg-surface">
          <div className="text-xs font-semibold uppercase tracking-widest text-mist mb-2">
            On deck, not yet
          </div>
          <p className="text-sm text-text/85 leading-relaxed mb-3">
            {plan.primary
              ? "These also look off today, but the change above will move them. Make it, re-shoot, and see what is left."
              : "These look off, but they wait until the reading above is sorted out."}
          </p>
          <ul className="space-y-2">
            {plan.onDeck.map((rec) => (
              <li key={rec.area} className="text-sm">
                <details>
                  <summary className="cursor-pointer font-semibold text-text">
                    {rec.title} <span className="font-normal text-mist">({STEP_NAME[rec.step].split(" · ")[1].toLowerCase()})</span>
                  </summary>
                  <p className="mt-1 text-text/80 leading-relaxed">{rec.observation}</p>
                </details>
              </li>
            ))}
          </ul>
        </Card>
      )}

      {plan.goingWell.length > 0 && (
        <Card>
          <div className="text-xs font-semibold uppercase tracking-widest text-emerald-700 mb-2">
            What already looks good
          </div>
          <ul className="space-y-1.5 text-sm text-text/90 leading-relaxed">
            {plan.goingWell.map((line) => (
              <li key={line} className="flex gap-2">
                <span aria-hidden="true" className="text-emerald-600">✓</span>
                <span>{line}</span>
              </li>
            ))}
          </ul>
        </Card>
      )}

      <Card>
        <div className="flex flex-wrap items-baseline justify-between gap-2 mb-1">
          <div className="text-xs font-semibold uppercase tracking-widest text-mist">The numbers</div>
          <div className="text-xs text-mist">
            Ranges for {STYLES[settings.style].label.toLowerCase()},{" "}
            {settings.captureMode === "static" ? "posed photo" : "measured while pedalling"}
          </div>
        </div>
        <div className="overflow-x-auto -mx-1 px-1">
          <table className="w-full min-w-[420px] border-collapse" data-testid="measurement-table">
            <thead>
              <tr className="text-xs text-mist">
                <th scope="col" className="py-2 text-left font-medium">Measurement</th>
                <th scope="col" className="py-2 pr-3 text-right font-medium">You</th>
                <th scope="col" className="py-2 pr-3 text-right font-medium">Range</th>
                <th scope="col" className="py-2 text-right font-medium">Status</th>
              </tr>
            </thead>
            <tbody>
              {judged.map((f) => (
                <MeasurementRow key={f.id} finding={f} />
              ))}
              {reference.map((f) => (
                <MeasurementRow key={f.id} finding={f} />
              ))}
            </tbody>
          </table>
        </div>
        <p className="mt-3 text-xs text-mist leading-relaxed">
          Expect a few degrees of error either way from any 2D photo. &quot;At the edge&quot; means
          the number is outside the range by less than that error, so the tool will not ask you to
          change anything for it.
        </p>
      </Card>
    </div>
  );
}
