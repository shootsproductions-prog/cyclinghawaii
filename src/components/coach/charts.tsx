"use client";

// Charts for the coach page. Hand-drawn SVG, like the site's existing
// MetricChart, with a shared set of rules:
//
//   - one y-axis per chart, hairline solid gridlines, recessive axes
//   - thin marks: 2px lines, columns capped at 24px with a rounded top
//   - text is always ink or muted grey, never the series colour
//   - every chart answers to hover, touch and keyboard focus with the
//     same tooltip, and every number is also in the table below
//
// Colours: blue is "your riding", orange is fatigue. The pair was
// checked for colour-blind separation and contrast on white.

import { useEffect, useId, useRef, useState } from "react";
import type { KeyboardEvent, ReactNode } from "react";
import { dayNumber, weekdayOf } from "@/lib/coach/load";
import type { CoachAnalysis, IntensitySplit, LoadPoint, WeekSummary } from "@/lib/coach/types";

export const VIZ = {
  blue: "#2a78d6",
  blueLight: "#86b6ef",
  blueDark: "#184f95",
  orange: "#eb6834",
  red: "#e34948",
  grid: "#e5e5e5",
  axis: "#c9c9c9",
  muted: "#666666",
  ink: "#1a1a1a",
  empty: "#f0efec",
  /** One-hue ramp for the ride calendar, light to dark. */
  ramp: ["#9ec5f4", "#5598e7", "#256abf", "#104281"],
};

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
const WEEKDAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

export function shortDay(key: string): string {
  return `${MONTHS[Number(key.slice(5, 7)) - 1]} ${Number(key.slice(8, 10))}`;
}

export function hoursText(h: number): string {
  const whole = Math.floor(h);
  const minutes = Math.round((h - whole) * 60);
  if (minutes === 60) return `${whole + 1} h`;
  if (whole === 0) return `${minutes} min`;
  return minutes === 0 ? `${whole} h` : `${whole} h ${String(minutes).padStart(2, "0")}`;
}

/** Measure the element's width so SVG text is drawn at real pixel sizes. */
function useWidth<T extends HTMLElement>(): [React.RefObject<T | null>, number] {
  const ref = useRef<T>(null);
  const [width, setWidth] = useState(0);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const measure = () => setWidth(Math.round(el.getBoundingClientRect().width));
    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(el);
    return () => observer.disconnect();
  }, []);
  return [ref, width];
}

/** Clean axis ticks from 0 to at least `max`. */
function ticks(max: number, target = 4): number[] {
  if (max <= 0) return [0, 1];
  const rough = max / target;
  const pow = Math.pow(10, Math.floor(Math.log10(rough)));
  const step = [1, 2, 2.5, 5, 10].map((m) => m * pow).find((s) => s >= rough) ?? rough;
  const out: number[] = [];
  for (let v = 0; v < max + step * 0.999; v += step) out.push(Math.round(v * 100) / 100);
  return out;
}

function Tooltip({ x, width, children }: { x: number; width: number; children: ReactNode }) {
  const boxWidth = 176;
  const left = Math.min(Math.max(4, x - boxWidth / 2), Math.max(4, width - boxWidth - 4));
  return (
    <div
      role="status"
      className="absolute top-0 z-10 pointer-events-none rounded-lg border border-border bg-card shadow-md px-3 py-2 text-xs leading-relaxed"
      style={{ left, width: boxWidth }}
    >
      {children}
    </div>
  );
}

function Row({ swatch, label, value }: { swatch?: string; label: string; value: string }) {
  return (
    <div className="flex items-center justify-between gap-2">
      <span className="flex items-center gap-1.5 text-mist">
        {swatch && <span className="inline-block w-3 h-0.5 rounded-full" style={{ background: swatch }} />}
        {label}
      </span>
      <span className="font-semibold text-text tabular-nums">{value}</span>
    </div>
  );
}

/** Left/right arrow keys step through data points; Escape clears. */
function stepKeys(count: number, active: number | null, set: (i: number | null) => void) {
  return (e: KeyboardEvent) => {
    if (e.key === "ArrowRight" || e.key === "ArrowLeft") {
      e.preventDefault();
      const from = active ?? (e.key === "ArrowRight" ? -1 : count);
      set(Math.min(count - 1, Math.max(0, from + (e.key === "ArrowRight" ? 1 : -1))));
    } else if (e.key === "Escape") {
      set(null);
    }
  };
}

// ───────────────────── Weekly hours ─────────────────────

export function WeeklyHoursChart({ weeks }: { weeks: WeekSummary[] }) {
  const [ref, width] = useWidth<HTMLDivElement>();
  const [hovered, setActive] = useState<number | null>(null);
  const active = hovered !== null && hovered < weeks.length ? hovered : null;
  const height = 210;
  const pad = { top: 22, right: 8, bottom: 26, left: 34 };
  const innerW = Math.max(0, width - pad.left - pad.right);
  const innerH = height - pad.top - pad.bottom;
  const max = Math.max(1, ...weeks.map((w) => w.hours));
  const yTicks = ticks(max);
  const top = yTicks[yTicks.length - 1];
  const band = weeks.length ? innerW / weeks.length : 0;
  const barW = Math.min(24, Math.max(4, band - 6));
  const y = (h: number) => pad.top + innerH - (h / top) * innerH;
  const labelEvery = band < 44 ? 2 : 1;
  const peak = weeks.reduce((best, w, i) => (w.hours > weeks[best].hours ? i : best), 0);
  const lastDone = weeks.length - 2;
  const current = active !== null ? weeks[active] : undefined;

  return (
    <div
      ref={ref}
      className="relative"
      tabIndex={0}
      role="group"
      aria-label={`Hours ridden per week for the last ${weeks.length} weeks. Use the left and right arrow keys to read each week.`}
      onKeyDown={stepKeys(weeks.length, active, setActive)}
      onBlur={() => setActive(null)}
      onPointerLeave={() => setActive(null)}
      data-testid="chart-weekly"
    >
      {width > 0 && (
        <svg width={width} height={height} role="img" aria-hidden="true">
          {yTicks.map((t) => (
            <g key={t}>
              <line x1={pad.left} x2={width - pad.right} y1={y(t)} y2={y(t)} stroke={t === 0 ? VIZ.axis : VIZ.grid} strokeWidth={1} />
              <text x={pad.left - 6} y={y(t)} textAnchor="end" dominantBaseline="central" fontSize={11} fill={VIZ.muted} style={{ fontVariantNumeric: "tabular-nums" }}>
                {t}
              </text>
            </g>
          ))}
          <text x={pad.left - 28} y={10} fontSize={11} fill={VIZ.muted}>
            hours
          </text>
          {weeks.map((w, i) => {
            const cx = pad.left + band * i + band / 2;
            const barH = (w.hours / top) * innerH;
            const x0 = cx - barW / 2;
            const y0 = y(w.hours);
            const r = Math.min(4, barH, barW / 2);
            const labelled = w.hours > 0 && (i === peak || i === lastDone);
            return (
              <g key={w.weekStart}>
                {barH > 0 && (
                  <path
                    d={`M ${x0} ${y0 + barH} V ${y0 + r} Q ${x0} ${y0} ${x0 + r} ${y0} H ${x0 + barW - r} Q ${x0 + barW} ${y0} ${x0 + barW} ${y0 + r} V ${y0 + barH} Z`}
                    fill={w.current ? VIZ.blueLight : VIZ.blue}
                    opacity={active === null || active === i ? 1 : 0.55}
                  />
                )}
                {labelled && (
                  <text x={cx} y={y0 - 6} textAnchor="middle" fontSize={11} fontWeight={600} fill={VIZ.ink}>
                    {w.hours.toFixed(1)}
                  </text>
                )}
                {i % labelEvery === (weeks.length - 1) % labelEvery && (
                  <text x={cx} y={height - 8} textAnchor="middle" fontSize={11} fill={VIZ.muted}>
                    {shortDay(w.weekStart)}
                  </text>
                )}
                {/* Hit target: the whole band, not just the painted bar. */}
                <rect
                  x={pad.left + band * i}
                  y={pad.top}
                  width={band}
                  height={innerH + pad.bottom}
                  fill="transparent"
                  onPointerEnter={() => setActive(i)}
                  onPointerDown={() => setActive(i)}
                />
              </g>
            );
          })}
        </svg>
      )}
      {current && active !== null && (
        <Tooltip x={pad.left + band * active + band / 2} width={width}>
          <div className="font-semibold text-text mb-1">
            Week of {shortDay(current.weekStart)}
            {current.current ? " (so far)" : ""}
          </div>
          <Row label="Riding time" value={hoursText(current.hours)} />
          <Row label="Rides" value={String(current.rides)} />
          <Row label="Distance" value={`${Math.round(current.distanceM / 1609.344)} mi`} />
          <Row label="Climbing" value={`${Math.round(current.climbM * 3.28084).toLocaleString("en-US")} ft`} />
          <Row label="Load" value={String(Math.round(current.load))} />
        </Tooltip>
      )}
      <p className="mt-1 text-xs text-mist">
        Each column is one week, Monday to Sunday. The lighter column is this week so far.
      </p>
    </div>
  );
}

// ───────────────────── Fitness, fatigue, form ─────────────────────

function linePath(points: [number, number][]): string {
  return points.map(([px, py], i) => `${i === 0 ? "M" : "L"}${px.toFixed(1)},${py.toFixed(1)}`).join(" ");
}

export function LoadChart({ series }: { series: LoadPoint[] }) {
  const [ref, width] = useWidth<HTMLDivElement>();
  const [hovered, setActive] = useState<number | null>(null);
  // The series can change length under a remembered index (new rides, another source).
  const active = hovered !== null && hovered < series.length ? hovered : null;
  const clip = useId().replace(/[^a-zA-Z0-9]/g, "");
  const pad = { top: 12, right: 10, bottom: 22, left: 34 };
  const topH = 170;
  const gap = 34;
  const formH = 96;
  const height = pad.top + topH + gap + formH + pad.bottom;
  const innerW = Math.max(0, width - pad.left - pad.right);
  const n = series.length;
  const x = (i: number) => pad.left + (n <= 1 ? innerW / 2 : (i / (n - 1)) * innerW);

  const maxLoad = Math.max(10, ...series.map((p) => Math.max(p.fitness, p.fatigue)));
  const yTicks = ticks(maxLoad);
  const topMax = yTicks[yTicks.length - 1];
  const yTop = (v: number) => pad.top + topH - (v / topMax) * topH;

  const formExtent = Math.max(10, ...series.map((p) => Math.abs(p.form)));
  const formTick = ticks(formExtent, 2);
  const formMax = formTick[formTick.length - 1];
  const formTop = pad.top + topH + gap;
  const yForm = (v: number) => formTop + formH / 2 - (v / formMax) * (formH / 2);
  const zero = yForm(0);

  const fitnessPts = series.map((p, i): [number, number] => [x(i), yTop(p.fitness)]);
  const fatiguePts = series.map((p, i): [number, number] => [x(i), yTop(p.fatigue)]);
  const formPts = series.map((p, i): [number, number] => [x(i), yForm(p.form)]);
  const formArea = n > 1 ? `${linePath(formPts)} L${x(n - 1).toFixed(1)},${zero.toFixed(1)} L${x(0).toFixed(1)},${zero.toFixed(1)} Z` : "";

  const pick = (clientX: number) => {
    const el = ref.current;
    if (!el || n === 0) return;
    const rel = clientX - el.getBoundingClientRect().left - pad.left;
    setActive(Math.min(n - 1, Math.max(0, Math.round((rel / Math.max(innerW, 1)) * (n - 1)))));
  };

  const last = series[n - 1];
  const point = active !== null ? series[active] : null;
  // Month ticks along the x axis.
  const monthTicks = series
    .map((p, i) => ({ p, i }))
    .filter(({ p }) => p.day.endsWith("-01"));

  return (
    <div data-testid="chart-load">
      <div className="flex flex-wrap items-center gap-x-5 gap-y-1 mb-2 text-xs text-mist">
        <span className="flex items-center gap-1.5">
          <span className="inline-block w-4 h-0.5 rounded-full" style={{ background: VIZ.blue }} />
          Fitness (six-week average){last ? <strong className="text-text font-semibold"> {Math.round(last.fitness)}</strong> : null}
        </span>
        <span className="flex items-center gap-1.5">
          <span className="inline-block w-4 h-0.5 rounded-full" style={{ background: VIZ.orange }} />
          Fatigue (one-week average){last ? <strong className="text-text font-semibold"> {Math.round(last.fatigue)}</strong> : null}
        </span>
      </div>
      <div
        ref={ref}
        className="relative touch-pan-y"
        tabIndex={0}
        role="group"
        aria-label="Fitness, fatigue and form by day. Use the left and right arrow keys to read each day."
        onKeyDown={stepKeys(n, active, setActive)}
        onBlur={() => setActive(null)}
        onPointerMove={(e) => pick(e.clientX)}
        onPointerDown={(e) => pick(e.clientX)}
        onPointerLeave={() => setActive(null)}
      >
        {width > 0 && n > 1 && (
          <svg width={width} height={height} aria-hidden="true">
            <defs>
              <clipPath id={`${clip}-up`}>
                <rect x={0} y={formTop} width={width} height={Math.max(0, zero - formTop)} />
              </clipPath>
              <clipPath id={`${clip}-down`}>
                <rect x={0} y={zero} width={width} height={Math.max(0, formTop + formH - zero)} />
              </clipPath>
            </defs>

            {/* Top panel: fitness and fatigue share one axis (load per day). */}
            {yTicks.map((t) => (
              <g key={`t${t}`}>
                <line x1={pad.left} x2={width - pad.right} y1={yTop(t)} y2={yTop(t)} stroke={t === 0 ? VIZ.axis : VIZ.grid} strokeWidth={1} />
                <text x={pad.left - 6} y={yTop(t)} textAnchor="end" dominantBaseline="central" fontSize={11} fill={VIZ.muted} style={{ fontVariantNumeric: "tabular-nums" }}>
                  {t}
                </text>
              </g>
            ))}
            <path d={linePath(fatiguePts)} fill="none" stroke={VIZ.orange} strokeWidth={2} strokeLinejoin="round" strokeLinecap="round" />
            <path d={linePath(fitnessPts)} fill="none" stroke={VIZ.blue} strokeWidth={2} strokeLinejoin="round" strokeLinecap="round" />
            <circle cx={fatiguePts[n - 1][0]} cy={fatiguePts[n - 1][1]} r={4} fill={VIZ.orange} stroke="#ffffff" strokeWidth={2} />
            <circle cx={fitnessPts[n - 1][0]} cy={fitnessPts[n - 1][1]} r={4} fill={VIZ.blue} stroke="#ffffff" strokeWidth={2} />

            {/* Bottom panel: form, on its own axis, split at zero. */}
            <text x={pad.left} y={formTop - 12} fontSize={11} fill={VIZ.muted}>
              Form
            </text>
            {[formMax, -formMax].map((t) => (
              <g key={`f${t}`}>
                <line x1={pad.left} x2={width - pad.right} y1={yForm(t)} y2={yForm(t)} stroke={VIZ.grid} strokeWidth={1} />
                <text x={pad.left - 6} y={yForm(t)} textAnchor="end" dominantBaseline="central" fontSize={11} fill={VIZ.muted} style={{ fontVariantNumeric: "tabular-nums" }}>
                  {t > 0 ? `+${t}` : `−${Math.abs(t)}`}
                </text>
              </g>
            ))}
            <path d={formArea} fill={VIZ.blue} fillOpacity={0.28} clipPath={`url(#${clip}-up)`} />
            <path d={formArea} fill={VIZ.red} fillOpacity={0.28} clipPath={`url(#${clip}-down)`} />
            <path d={linePath(formPts)} fill="none" stroke={VIZ.blue} strokeWidth={2} strokeLinejoin="round" clipPath={`url(#${clip}-up)`} />
            <path d={linePath(formPts)} fill="none" stroke={VIZ.red} strokeWidth={2} strokeLinejoin="round" clipPath={`url(#${clip}-down)`} />
            <line x1={pad.left} x2={width - pad.right} y1={zero} y2={zero} stroke={VIZ.axis} strokeWidth={1} />
            <text x={pad.left - 6} y={zero} textAnchor="end" dominantBaseline="central" fontSize={11} fill={VIZ.muted}>
              0
            </text>

            {monthTicks.map(({ p, i }) => (
              <text key={p.day} x={x(i)} y={height - 6} textAnchor="middle" fontSize={11} fill={VIZ.muted}>
                {MONTHS[Number(p.day.slice(5, 7)) - 1]}
              </text>
            ))}

            {active !== null && (
              <g pointerEvents="none">
                <line x1={x(active)} x2={x(active)} y1={pad.top} y2={formTop + formH} stroke={VIZ.muted} strokeWidth={1} />
                <circle cx={x(active)} cy={fatiguePts[active][1]} r={4} fill={VIZ.orange} stroke="#ffffff" strokeWidth={2} />
                <circle cx={x(active)} cy={fitnessPts[active][1]} r={4} fill={VIZ.blue} stroke="#ffffff" strokeWidth={2} />
                <circle cx={x(active)} cy={formPts[active][1]} r={4} fill={series[active].form >= 0 ? VIZ.blue : VIZ.red} stroke="#ffffff" strokeWidth={2} />
              </g>
            )}
          </svg>
        )}
        {n <= 1 && <p className="text-sm text-mist py-8">Not enough days of riding yet to draw a trend.</p>}
        {point && active !== null && (
          <Tooltip x={x(active)} width={width}>
            <div className="font-semibold text-text mb-1">{shortDay(point.day)}</div>
            <Row swatch={VIZ.blue} label="Fitness" value={point.fitness.toFixed(0)} />
            <Row swatch={VIZ.orange} label="Fatigue" value={point.fatigue.toFixed(0)} />
            <Row label="Form" value={`${point.form >= 0 ? "+" : "−"}${Math.abs(point.form).toFixed(0)}`} />
            <Row label="Load that day" value={point.load.toFixed(0)} />
          </Tooltip>
        )}
      </div>
    </div>
  );
}

// ───────────────────── Intensity split ─────────────────────

export function IntensityBar({ split }: { split: IntensitySplit }) {
  const [active, setActive] = useState<number | null>(null);
  const parts = [
    { name: "Easy", pct: split.easyPct, fill: VIZ.blueLight, text: "#0b0b0b" },
    { name: "Moderate", pct: split.moderatePct, fill: VIZ.blue, text: "#ffffff" },
    { name: "Hard", pct: split.hardPct, fill: VIZ.blueDark, text: "#ffffff" },
  ];
  const summary = parts.map((p) => `${p.name} ${Math.round(p.pct)}%`).join(", ");
  return (
    <div data-testid="chart-intensity">
      <div
        className="flex h-7 w-full gap-0.5"
        role="img"
        aria-label={`Share of riding time by intensity over the last four weeks: ${summary}.`}
        onPointerLeave={() => setActive(null)}
      >
        {parts.map((p, i) =>
          p.pct <= 0 ? null : (
            <div
              key={p.name}
              tabIndex={0}
              onPointerEnter={() => setActive(i)}
              onPointerDown={() => setActive(i)}
              onFocus={() => setActive(i)}
              onBlur={() => setActive(null)}
              className="h-full rounded flex items-center min-w-[3px] outline-offset-2 focus-visible:outline-2 focus-visible:outline-strava"
              style={{ width: `${p.pct}%`, background: p.fill, opacity: active === null || active === i ? 1 : 0.6 }}
              aria-label={`${p.name}: ${Math.round(p.pct)}% of riding time, ${hoursText((split.hours * p.pct) / 100)}`}
            >
              {/* Only print the share where the block is wide enough to hold it. */}
              {p.pct >= 12 && (
                <span className="pl-2 text-xs font-semibold tabular-nums" style={{ color: p.text }}>
                  {Math.round(p.pct)}%
                </span>
              )}
            </div>
          )
        )}
      </div>
      <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-xs text-mist">
        {parts.map((p) => (
          <span key={p.name} className="flex items-center gap-1.5">
            <span className="inline-block w-2.5 h-2.5 rounded-sm" style={{ background: p.fill }} />
            {p.name}
          </span>
        ))}
      </div>
      <p className="mt-2 text-xs text-text min-h-[1.25rem]" aria-live="polite">
        {active !== null
          ? `${parts[active].name}: ${Math.round(parts[active].pct)}% of riding time, about ${hoursText((split.hours * parts[active].pct) / 100)}.`
          : ""}
      </p>
    </div>
  );
}

// ───────────────────── Ride calendar ─────────────────────

function rampStep(minutes: number): string {
  if (minutes <= 0) return VIZ.empty;
  if (minutes < 60) return VIZ.ramp[0];
  if (minutes < 120) return VIZ.ramp[1];
  if (minutes < 180) return VIZ.ramp[2];
  return VIZ.ramp[3];
}

export function RideCalendar({ calendar, today }: { calendar: CoachAnalysis["consistency"]["calendar"]; today: string }) {
  const [hovered, setActive] = useState<number | null>(null);
  const active = hovered !== null && hovered < calendar.length ? hovered : null;
  const weeks: { day: string; minutes: number }[][] = [];
  for (let i = 0; i < calendar.length; i += 7) weeks.push(calendar.slice(i, i + 7));
  const todayN = dayNumber(today);
  const cell = active !== null ? calendar[active] : null;
  return (
    <div data-testid="chart-calendar" onPointerLeave={() => setActive(null)}>
      <div className="grid gap-0.5" style={{ gridTemplateColumns: "3.25rem repeat(7, minmax(0, 2.25rem))" }} role="grid" aria-label="Days ridden over the last eight weeks">
        <div />
        {WEEKDAYS.map((d) => (
          <div key={d} className="text-[0.65rem] text-mist text-center pb-0.5" aria-hidden="true">
            {d[0]}
          </div>
        ))}
        {weeks.map((week, w) => (
          <div key={week[0].day} className="contents" role="row">
            <div className="text-[0.65rem] text-mist flex items-center whitespace-nowrap pr-1">{shortDay(week[0].day)}</div>
            {week.map((d, i) => {
              const index = w * 7 + i;
              const future = dayNumber(d.day) > todayN;
              const label = `${WEEKDAYS[weekdayOf(dayNumber(d.day))]} ${shortDay(d.day)}: ${
                future ? "still to come" : d.minutes > 0 ? hoursText(d.minutes / 60) : "no ride"
              }`;
              return (
                <div
                  key={d.day}
                  role="gridcell"
                  tabIndex={future ? -1 : 0}
                  aria-label={label}
                  onPointerEnter={() => setActive(index)}
                  onPointerDown={() => setActive(index)}
                  onFocus={() => setActive(index)}
                  onBlur={() => setActive(null)}
                  className="h-6 rounded-[3px] outline-offset-1 focus-visible:outline-2 focus-visible:outline-strava"
                  style={{
                    background: future ? "transparent" : rampStep(d.minutes),
                    border: future ? `1px dashed ${VIZ.grid}` : undefined,
                    boxShadow: active === index ? `0 0 0 2px ${VIZ.ink}` : undefined,
                  }}
                />
              );
            })}
          </div>
        ))}
      </div>
      <div className="mt-2 flex items-center gap-1.5 text-[0.65rem] text-mist">
        <span>No ride</span>
        <span className="inline-block w-3 h-3 rounded-[3px]" style={{ background: VIZ.empty }} />
        {VIZ.ramp.map((c) => (
          <span key={c} className="inline-block w-3 h-3 rounded-[3px]" style={{ background: c }} />
        ))}
        <span>3 h or more</span>
      </div>
      <p className="mt-1.5 text-xs text-text min-h-[1.25rem]" aria-live="polite">
        {cell
          ? `${WEEKDAYS[weekdayOf(dayNumber(cell.day))]} ${shortDay(cell.day)}: ${
              dayNumber(cell.day) > todayN ? "still to come" : cell.minutes > 0 ? hoursText(cell.minutes / 60) : "no ride"
            }`
          : ""}
      </p>
    </div>
  );
}

// ───────────────────── Sparkline for a stat tile ─────────────────────

export function Sparkline({ values }: { values: (number | undefined)[] }) {
  const points = values.map((v, i) => ({ v, i })).filter((p): p is { v: number; i: number } => p.v !== undefined);
  if (points.length < 2) return null;
  const w = 96;
  const h = 26;
  const min = Math.min(...points.map((p) => p.v));
  const max = Math.max(...points.map((p) => p.v));
  const span = max - min || 1;
  const px = (i: number) => 3 + (i / (values.length - 1)) * (w - 6);
  const py = (v: number) => h - 4 - ((v - min) / span) * (h - 8);
  const lastPoint = points[points.length - 1];
  return (
    <svg width={w} height={h} aria-hidden="true">
      <path d={linePath(points.map((p): [number, number] => [px(p.i), py(p.v)]))} fill="none" stroke={VIZ.axis} strokeWidth={2} strokeLinejoin="round" strokeLinecap="round" />
      <circle cx={px(lastPoint.i)} cy={py(lastPoint.v)} r={3.5} fill={VIZ.blue} stroke="#ffffff" strokeWidth={1.5} />
    </svg>
  );
}
