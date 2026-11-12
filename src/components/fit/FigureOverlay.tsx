"use client";

// The lines a coach would draw over the rider: skeleton, joint angles
// and the knee-over-pedal plumb line. Renders SVG content in IMAGE
// pixel coordinates, so it must sit inside an <svg viewBox="0 0 W H">
// stretched over the frame. `unit` is how many image pixels make one
// screen pixel, so strokes and text stay the same size on screen.

import type { KeyboardEvent, PointerEvent } from "react";
import { LANDMARKS, LANDMARK_ORDER, SKELETON } from "@/lib/fit/landmarks";
import type {
  Finding,
  FrameKind,
  LandmarkId,
  Landmarks,
  MeasurementId,
  Measurements,
  Point,
} from "@/lib/fit/types";

const ORANGE = "#fc5200";
const INK = "#111111";

const STATUS_FILL: Record<Finding["status"] | "none", string> = {
  "in-range": "#047857",
  borderline: "#b45309",
  out: "#b91c1c",
  none: INK,
};

interface Props {
  kind: FrameKind;
  landmarks: Landmarks;
  unit: number;
  measurements?: Measurements;
  findings?: Finding[];
  autoPlaced?: LandmarkId[];
  activeId?: LandmarkId | null;
  /** Level-line angle in degrees, drawn when the rider is adjusting tilt. */
  showLevel?: { tiltDeg: number; width: number; height: number } | null;
  /** Thumbnail mode: skeleton and small dots only. */
  compact?: boolean;
  onPointPointerDown?: (id: LandmarkId, event: PointerEvent<SVGGElement>) => void;
  onPointKeyDown?: (id: LandmarkId, event: KeyboardEvent<SVGGElement>) => void;
}

const RAD = Math.PI / 180;

function ray(from: Point, to: Point): number {
  return Math.atan2(to.y - from.y, to.x - from.x);
}

/** SVG path for the arc at `v` between the rays toward `a` and `c`, taking the short way round. */
function arcPath(v: Point, a: Point, c: Point, r: number): { d: string; mid: Point } {
  const a1 = ray(v, a);
  const a2 = ray(v, c);
  let sweep = a2 - a1;
  while (sweep > Math.PI) sweep -= 2 * Math.PI;
  while (sweep < -Math.PI) sweep += 2 * Math.PI;
  const start = { x: v.x + Math.cos(a1) * r, y: v.y + Math.sin(a1) * r };
  const end = { x: v.x + Math.cos(a2) * r, y: v.y + Math.sin(a2) * r };
  const midAngle = a1 + sweep / 2;
  return {
    d: `M ${start.x} ${start.y} A ${r} ${r} 0 0 ${sweep > 0 ? 1 : 0} ${end.x} ${end.y}`,
    mid: { x: v.x + Math.cos(midAngle) * r, y: v.y + Math.sin(midAngle) * r },
  };
}

/** The point the same distance beyond `through` as `from` is before it. */
function extend(from: Point, through: Point, length: number): Point {
  const a = ray(from, through);
  return { x: through.x + Math.cos(a) * length, y: through.y + Math.sin(a) * length };
}

interface AngleMark {
  id: MeasurementId;
  vertex: Point;
  a: Point;
  c: Point;
  /** Dashed helper line from the vertex, e.g. the thigh carried on past the knee. */
  guide?: Point;
}

function angleMarks(kind: FrameKind, l: Landmarks, unit: number): AngleMark[] {
  const marks: AngleMark[] = [];
  const reach = 70 * unit;
  // The pedal-forward frame is only about the knee-over-pedal line.
  if (kind === "forward") return marks;
  if (l.hip && l.knee && l.ankle) {
    const guide = extend(l.hip, l.knee, reach);
    marks.push({ id: kind === "top" ? "kneeTop" : "kneeBottom", vertex: l.knee, a: guide, c: l.ankle, guide });
  }
  if (l.shoulder && l.hip && l.knee) {
    marks.push({ id: kind === "top" ? "hipTop" : "hipBottom", vertex: l.hip, a: l.shoulder, c: l.knee });
  }
  if (kind === "bottom") {
    if (l.hip && l.shoulder && l.elbow) {
      marks.push({ id: "shoulder", vertex: l.shoulder, a: l.hip, c: l.elbow });
    }
    if (l.shoulder && l.elbow && l.wrist) {
      const guide = extend(l.shoulder, l.elbow, reach * 0.8);
      marks.push({ id: "elbow", vertex: l.elbow, a: guide, c: l.wrist, guide });
    }
    if (l.knee && l.ankle && l.toe) {
      marks.push({ id: "ankleBottom", vertex: l.ankle, a: l.knee, c: l.toe });
    }
  }
  return marks;
}

function Label({
  at,
  text,
  unit,
  fill,
}: {
  at: Point;
  text: string;
  unit: number;
  fill: string;
}) {
  const fontSize = 13 * unit;
  const padX = 5 * unit;
  const w = text.length * fontSize * 0.62 + padX * 2;
  const h = fontSize * 1.55;
  return (
    <g pointerEvents="none">
      <rect
        x={at.x - w / 2}
        y={at.y - h / 2}
        width={w}
        height={h}
        rx={h / 2}
        fill={fill}
        stroke="#ffffff"
        strokeWidth={1.2 * unit}
      />
      <text
        x={at.x}
        y={at.y}
        fontSize={fontSize}
        fontWeight={700}
        fill="#ffffff"
        textAnchor="middle"
        dominantBaseline="central"
        style={{ fontFamily: "var(--font-inter), system-ui, sans-serif" }}
      >
        {text}
      </text>
    </g>
  );
}

export default function FigureOverlay({
  kind,
  landmarks,
  unit,
  measurements,
  findings,
  autoPlaced,
  activeId,
  showLevel,
  compact = false,
  onPointPointerDown,
  onPointKeyDown,
}: Props) {
  // Reference-only measurements keep a neutral label: they are never judged.
  const status = (id: MeasurementId): Finding["status"] | "none" => {
    const finding = findings?.find((f) => f.id === id);
    return finding && !finding.informational ? finding.status : "none";
  };
  const interactive = !!onPointPointerDown;
  const l = landmarks;
  // Compact (thumbnail) mode draws the skeleton only: no arcs, no numbers.
  const marks = compact ? [] : angleMarks(kind, l, unit);
  const arcRadius = 30 * unit;

  const torso = !compact && kind === "bottom" && l.hip && l.shoulder ? measurements?.torso : undefined;
  const kops = !compact && kind === "forward" && l.knee && l.pedal ? measurements?.kops : undefined;

  return (
    <g>
      {showLevel && (
        <line
          x1={0}
          y1={showLevel.height / 2 + Math.tan(showLevel.tiltDeg * RAD) * (showLevel.width / 2)}
          x2={showLevel.width}
          y2={showLevel.height / 2 - Math.tan(showLevel.tiltDeg * RAD) * (showLevel.width / 2)}
          stroke="#38bdf8"
          strokeWidth={2 * unit}
          strokeDasharray={`${10 * unit} ${6 * unit}`}
          pointerEvents="none"
        />
      )}

      {/* Skeleton: dark underlay then light line, readable on any photo. */}
      <g pointerEvents="none" strokeLinecap="round">
        {SKELETON.map(([from, to]) => {
          const a = l[from];
          const b = l[to];
          if (!a || !b) return null;
          const bike = from === "bb";
          return (
            <g key={`${from}-${to}`}>
              <line x1={a.x} y1={a.y} x2={b.x} y2={b.y} stroke={INK} strokeOpacity={0.55} strokeWidth={(compact ? 3 : 5.5) * unit} />
              <line x1={a.x} y1={a.y} x2={b.x} y2={b.y} stroke={bike ? "#38bdf8" : "#ffffff"} strokeWidth={(compact ? 1.4 : 2.5) * unit} />
            </g>
          );
        })}
      </g>

      {/* Torso angle against the horizon. */}
      {torso && l.hip && l.shoulder && (
        <g pointerEvents="none">
          <line
            x1={l.hip.x}
            y1={l.hip.y}
            x2={l.hip.x + Math.sign(l.shoulder.x - l.hip.x || 1) * 95 * unit}
            y2={l.hip.y}
            stroke="#ffffff"
            strokeWidth={1.5 * unit}
            strokeDasharray={`${5 * unit} ${4 * unit}`}
          />
        </g>
      )}

      {/* Knee over pedal axle: plumb line up from the axle. */}
      {kind === "forward" && l.pedal && l.knee && (
        <g pointerEvents="none">
          <line
            x1={l.pedal.x}
            y1={l.pedal.y}
            x2={l.pedal.x}
            y2={l.knee.y - 30 * unit}
            stroke="#ffffff"
            strokeWidth={1.8 * unit}
            strokeDasharray={`${6 * unit} ${4 * unit}`}
          />
          <line
            x1={l.pedal.x}
            y1={l.knee.y}
            x2={l.knee.x}
            y2={l.knee.y}
            stroke={ORANGE}
            strokeWidth={2.5 * unit}
          />
        </g>
      )}

      {/* Joint angle arcs. */}
      <g pointerEvents="none" fill="none">
        {marks.map((mark) => {
          const arc = arcPath(mark.vertex, mark.a, mark.c, arcRadius);
          return (
            <g key={mark.id}>
              {mark.guide && (
                <line
                  x1={mark.vertex.x}
                  y1={mark.vertex.y}
                  x2={mark.guide.x}
                  y2={mark.guide.y}
                  stroke="#ffffff"
                  strokeWidth={1.5 * unit}
                  strokeDasharray={`${5 * unit} ${4 * unit}`}
                />
              )}
              <path d={arc.d} stroke={INK} strokeOpacity={0.5} strokeWidth={4.5 * unit} />
              <path d={arc.d} stroke="#ffffff" strokeWidth={2 * unit} />
            </g>
          );
        })}
      </g>

      {/* Landmarks. */}
      {LANDMARK_ORDER.map((id) => {
        const p = l[id];
        if (!p) return null;
        const bike = LANDMARKS[id].manualOnly;
        const auto = autoPlaced?.includes(id);
        const active = activeId === id;
        const r = (compact ? 2.5 : active ? 8.5 : 6.5) * unit;
        return (
          <g
            key={id}
            data-point={id}
            tabIndex={interactive ? 0 : undefined}
            role={interactive ? "button" : undefined}
            aria-label={interactive ? `${LANDMARKS[id].label} point. Drag, or use arrow keys to nudge.` : undefined}
            onPointerDown={onPointPointerDown ? (e) => onPointPointerDown(id, e) : undefined}
            onKeyDown={onPointKeyDown ? (e) => onPointKeyDown(id, e) : undefined}
            style={interactive ? { cursor: "grab", outline: "none" } : undefined}
          >
            {/* Generous invisible hit target for fingers. */}
            {interactive && <circle cx={p.x} cy={p.y} r={22 * unit} fill="transparent" />}
            {active && (
              <circle cx={p.x} cy={p.y} r={15 * unit} fill="none" stroke="#ffffff" strokeWidth={2 * unit} strokeOpacity={0.9} />
            )}
            <circle
              cx={p.x}
              cy={p.y}
              r={r}
              fill={auto ? "#ffffff" : bike ? "#0ea5e9" : ORANGE}
              stroke={auto ? ORANGE : "#ffffff"}
              strokeWidth={(compact ? 0.8 : auto ? 3 : 2) * unit}
            />
          </g>
        );
      })}

      {/* Angle readouts, drawn last so they sit on top. */}
      {marks.map((mark) => {
        const value = measurements?.[mark.id]?.value;
        if (value === undefined) return null;
        const arc = arcPath(mark.vertex, mark.a, mark.c, arcRadius + 24 * unit);
        return (
          <Label
            key={mark.id}
            at={arc.mid}
            text={`${Math.round(value)}°`}
            unit={unit}
            fill={STATUS_FILL[status(mark.id)]}
          />
        );
      })}
      {torso && l.hip && l.shoulder && (
        // Behind the rider's back, halfway up the torso, where no joint label lands.
        <Label
          at={{
            x: (l.hip.x + l.shoulder.x) / 2 - Math.sign(l.shoulder.x - l.hip.x || 1) * 38 * unit,
            y: (l.hip.y + l.shoulder.y) / 2 - 20 * unit,
          }}
          text={`${Math.round(torso.value)}°`}
          unit={unit}
          fill={STATUS_FILL[status("torso")]}
        />
      )}
      {kops && l.knee && l.pedal && (
        <Label
          at={{ x: (l.knee.x + l.pedal.x) / 2, y: l.knee.y - 20 * unit }}
          text={`${kops.value > 0 ? "+" : ""}${Math.round(kops.value)} mm`}
          unit={unit}
          fill={STATUS_FILL[status("kops")]}
        />
      )}
    </g>
  );
}
