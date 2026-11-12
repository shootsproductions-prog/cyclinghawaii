"use client";

// Before and after, side by side: the same frames from two sessions
// and what each angle did between them. This is the "film it again
// and see if the cue worked" half of the coaching loop.

import { useState } from "react";
import { Badge, Card, display, type Tone } from "@/components/ToolUi";
import { analyzeSession, compareAnalyses, type Verdict } from "@/lib/fit/analyze";
import { formatRange, formatValue } from "@/lib/fit/assess";
import { FRAMES, FRAME_ORDER } from "@/lib/fit/landmarks";
import { SPECS } from "@/lib/fit/ranges";
import type { FitSession, FrameKind } from "@/lib/fit/types";
import FrameView from "./FrameView";

const VERDICT: Record<Verdict, { tone: Tone; label: string }> = {
  better: { tone: "good", label: "Closer" },
  worse: { tone: "bad", label: "Further" },
  same: { tone: "neutral", label: "No change" },
  "in-range": { tone: "good", label: "In range" },
  new: { tone: "neutral", label: "New" },
  gone: { tone: "neutral", label: "Not measured" },
};

function when(iso: string): string {
  return new Date(iso).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

export default function SessionCompare({
  before,
  after,
}: {
  before: FitSession;
  after: FitSession;
}) {
  const a = analyzeSession(before);
  const b = analyzeSession(after);
  const rows = compareAnalyses(a, b).filter((r) => !SPECS[r.id].informational);
  const shared = FRAME_ORDER.filter((k) => before.frames[k] && after.frames[k]);
  const available = shared.length > 0 ? shared : FRAME_ORDER.filter((k) => before.frames[k] || after.frames[k]);
  const [picked, setPicked] = useState<FrameKind | null>(null);
  const kind = picked && available.includes(picked) ? picked : available[0];

  const better = rows.filter((r) => r.verdict === "better").length;
  const worse = rows.filter((r) => r.verdict === "worse").length;
  const summary =
    better === 0 && worse === 0
      ? "Nothing moved by more than a camera can tell apart."
      : `${better} ${better === 1 ? "number" : "numbers"} moved closer to range${worse > 0 ? `, ${worse} moved further away` : ""}.`;

  return (
    <Card data-testid="session-compare">
      <div className="text-xs font-semibold uppercase tracking-widest text-strava mb-2">
        Before and after
      </div>
      <p className={`${display} text-xl font-bold tracking-tight text-text mb-1`} data-testid="compare-summary">
        {summary}
      </p>
      {after.changeNote && (
        <p className="text-sm text-mist mb-4">
          Change made before the second session: <span className="text-text">{after.changeNote}</span>
        </p>
      )}

      {available.length > 1 && (
        <div className="flex flex-wrap gap-1.5 my-4" role="tablist" aria-label="Frame to compare">
          {available.map((k) => (
            <button
              key={k}
              type="button"
              role="tab"
              aria-selected={k === kind}
              onClick={() => setPicked(k)}
              className={`text-xs px-3 py-1.5 rounded-full border transition-colors ${
                k === kind ? "bg-text text-bg border-text" : "bg-card text-text border-border hover:border-text/40"
              }`}
            >
              {FRAMES[k].clock}
            </button>
          ))}
        </div>
      )}

      <div className="grid grid-cols-2 gap-2 md:gap-4">
        {([
          ["Before", before, a],
          ["After", after, b],
        ] as const).map(([title, session, analysis]) => (
          <div key={title}>
            <div className="flex flex-wrap items-baseline justify-between gap-x-2 mb-1.5">
              <span className="text-xs font-semibold uppercase tracking-widest text-mist">{title}</span>
              <span className="text-xs text-mist truncate">
                {session.label} · {when(session.createdAt)}
              </span>
            </div>
            {kind && session.frames[kind] ? (
              <FrameView frame={session.frames[kind]!} analysis={analysis} displayWidth={420} />
            ) : (
              <div className="rounded-lg border border-dashed border-border bg-surface aspect-[4/3] flex items-center justify-center text-xs text-mist text-center px-3">
                No {kind ? FRAMES[kind].clock : ""} frame in this session
              </div>
            )}
          </div>
        ))}
      </div>

      <div className="overflow-x-auto mt-5 -mx-1 px-1">
        <table className="w-full min-w-[440px] border-collapse" data-testid="compare-table">
          <thead>
            <tr className="text-xs text-mist">
              <th scope="col" className="py-2 text-left font-medium">Measurement</th>
              <th scope="col" className="py-2 pr-3 text-right font-medium">Before</th>
              <th scope="col" className="py-2 pr-3 text-right font-medium">After</th>
              <th scope="col" className="py-2 pr-3 text-right font-medium">Change</th>
              <th scope="col" className="py-2 text-right font-medium">Toward range?</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => {
              const verdict = VERDICT[row.verdict];
              const delta = row.delta === undefined ? null : Math.round(row.delta);
              return (
                <tr key={row.id} className="border-t border-border" data-compare={row.id}>
                  <th scope="row" className="py-2.5 pr-3 text-left font-normal">
                    <div className="text-sm font-semibold text-text">{row.label}</div>
                    <div className="text-xs text-mist">range {formatRange(row.range, row.unit)}</div>
                  </th>
                  <td className="py-2.5 pr-3 text-right tabular-nums text-sm text-mist whitespace-nowrap">
                    {row.before === undefined ? "–" : formatValue(row.before, row.unit)}
                  </td>
                  <td className="py-2.5 pr-3 text-right tabular-nums text-sm font-semibold text-text whitespace-nowrap">
                    {row.after === undefined ? "–" : formatValue(row.after, row.unit)}
                  </td>
                  <td className="py-2.5 pr-3 text-right tabular-nums text-sm whitespace-nowrap" data-testid={`delta-${row.id}`}>
                    {delta === null
                      ? "–"
                      : `${delta > 0 ? "+" : delta < 0 ? "−" : ""}${Math.abs(delta)}${row.unit === "deg" ? "°" : " mm"}`}
                  </td>
                  <td className="py-2.5 text-right">
                    <Badge tone={verdict.tone}>{verdict.label}</Badge>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      <p className="mt-3 text-xs text-mist leading-relaxed">
        Only compare sessions shot from the same spot with the same setup. A change of a degree or
        two is inside what the camera can tell apart.
      </p>
    </Card>
  );
}
