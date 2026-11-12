// Turn placed landmarks into joint angles. Pure functions only.
//
// Angle conventions (all in degrees):
//   knee flexion     0 = straight leg. 180 minus the hip-knee-ankle angle.
//   hip angle        the shoulder-hip-knee angle. Smaller = more closed.
//   torso angle      hip-to-shoulder line above horizontal. 0 = flat back.
//   shoulder angle   the hip-shoulder-elbow angle (torso to upper arm).
//   elbow flexion    0 = locked straight. 180 minus shoulder-elbow-wrist.
//   ankle angle      the knee-ankle-toe angle. Bigger = toe pointing down.
//   kops             knee ahead (+) or behind (-) the pedal axle, in mm,
//                    with the crank level and forward.

import {
  angleAboveHorizontal,
  angleAt,
  clockDifference,
  crankClockAngle,
  distance,
  levelPoint,
} from "./geometry";
import { FRAMES } from "./landmarks";
import type {
  FrameData,
  FrameDiagnostics,
  FrameKind,
  Landmarks,
  MeasureResult,
  Measurement,
  MeasurementId,
  Measurements,
  Point,
} from "./types";

export interface MeasureOptions {
  crankLengthMm: number;
  tiltDeg?: number;
}

/**
 * Which way the rider faces in a frame: +1 toward the right edge,
 * -1 toward the left, or null when the frame has too few body points
 * to tell.
 */
export function facingOf(landmarks: Landmarks): 1 | -1 | null {
  const { shoulder, hip, wrist, knee, toe, heel } = landmarks;
  // Hands and shoulders are ahead of the hips on any bike.
  if (wrist && hip && wrist.x !== hip.x) return wrist.x > hip.x ? 1 : -1;
  if (shoulder && hip && shoulder.x !== hip.x) return shoulder.x > hip.x ? 1 : -1;
  if (toe && heel && toe.x !== heel.x) return toe.x > heel.x ? 1 : -1;
  // The knee sits ahead of the hip through the whole stroke.
  if (knee && hip && knee.x !== hip.x) return knee.x > hip.x ? 1 : -1;
  return null;
}

/** In the pedal-forward frame the pedal is ahead of the crank centre. */
function facingFromForwardCrank(landmarks: Landmarks | undefined): 1 | -1 | null {
  if (!landmarks?.pedal || !landmarks.bb || landmarks.pedal.x === landmarks.bb.x) return null;
  return landmarks.pedal.x > landmarks.bb.x ? 1 : -1;
}

function levelAll(landmarks: Landmarks, tiltDeg: number): Landmarks {
  if (!tiltDeg) return landmarks;
  const out: Landmarks = {};
  for (const [id, p] of Object.entries(landmarks) as [keyof Landmarks, Point | undefined][]) {
    if (p) out[id] = levelPoint(p, tiltDeg);
  }
  return out;
}

function m(id: MeasurementId, value: number, unit: "deg" | "mm", frame: FrameKind): Measurement | null {
  return Number.isFinite(value) ? { id, value, unit, frame } : null;
}

/** Knee flexion from a set of landmarks, or NaN when points are missing. */
export function kneeFlexion(l: Landmarks): number {
  if (!l.hip || !l.knee || !l.ankle) return NaN;
  return 180 - angleAt(l.hip, l.knee, l.ankle);
}

export function hipAngle(l: Landmarks): number {
  if (!l.shoulder || !l.hip || !l.knee) return NaN;
  return angleAt(l.shoulder, l.hip, l.knee);
}

export function torsoAngle(l: Landmarks): number {
  if (!l.shoulder || !l.hip) return NaN;
  return angleAboveHorizontal(l.hip, l.shoulder);
}

export function shoulderAngle(l: Landmarks): number {
  if (!l.hip || !l.shoulder || !l.elbow) return NaN;
  return angleAt(l.hip, l.shoulder, l.elbow);
}

export function elbowFlexion(l: Landmarks): number {
  if (!l.shoulder || !l.elbow || !l.wrist) return NaN;
  return 180 - angleAt(l.shoulder, l.elbow, l.wrist);
}

export function ankleAngle(l: Landmarks): number {
  if (!l.knee || !l.ankle || !l.toe) return NaN;
  return angleAt(l.knee, l.ankle, l.toe);
}

/** Pixels per millimetre from the marked crank arm, or undefined. */
export function scaleOf(l: Landmarks, crankLengthMm: number): number | undefined {
  if (!l.pedal || !l.bb || !(crankLengthMm > 0)) return undefined;
  const px = distance(l.pedal, l.bb);
  return px > 0 ? px / crankLengthMm : undefined;
}

/**
 * Measure everything the placed landmarks allow. Missing points just
 * mean missing measurements; nothing throws.
 */
export function measureFrames(
  frames: Partial<Record<FrameKind, Pick<FrameData, "landmarks">>>,
  options: MeasureOptions
): MeasureResult {
  const tilt = options.tiltDeg ?? 0;
  const measurements: Measurements = {};
  const diagnostics: Partial<Record<FrameKind, FrameDiagnostics>> = {};

  const levelled: Partial<Record<FrameKind, Landmarks>> = {};
  for (const kind of Object.keys(frames) as FrameKind[]) {
    const f = frames[kind];
    if (f) levelled[kind] = levelAll(f.landmarks, tilt);
  }

  // One facing direction for the session: the rider does not turn
  // around between frames. Prefer the frame with the most evidence.
  const sessionFacing: 1 | -1 =
    (levelled.bottom && facingOf(levelled.bottom)) ||
    (levelled.top && facingOf(levelled.top)) ||
    (levelled.forward && facingOf(levelled.forward)) ||
    facingFromForwardCrank(levelled.forward) ||
    1;

  for (const kind of Object.keys(levelled) as FrameKind[]) {
    const l = levelled[kind]!;
    const facing = facingOf(l) ?? sessionFacing;
    const d: FrameDiagnostics = { facing };
    if (l.bb && l.pedal) {
      const clock = crankClockAngle(l.bb, l.pedal, facing);
      if (Number.isFinite(clock)) {
        d.crankClockDeg = clock;
        d.crankErrorDeg = clockDifference(clock, FRAMES[kind].targetClockDeg);
      }
      d.pxPerMm = scaleOf(l, options.crankLengthMm);
    }
    diagnostics[kind] = d;
  }

  const put = (x: Measurement | null) => {
    if (x) measurements[x.id] = x;
  };

  const bottom = levelled.bottom;
  if (bottom) {
    put(m("kneeBottom", kneeFlexion(bottom), "deg", "bottom"));
    put(m("hipBottom", hipAngle(bottom), "deg", "bottom"));
    put(m("torso", torsoAngle(bottom), "deg", "bottom"));
    put(m("shoulder", shoulderAngle(bottom), "deg", "bottom"));
    put(m("elbow", elbowFlexion(bottom), "deg", "bottom"));
    put(m("ankleBottom", ankleAngle(bottom), "deg", "bottom"));
  }

  const top = levelled.top;
  if (top) {
    put(m("kneeTop", kneeFlexion(top), "deg", "top"));
    put(m("hipTop", hipAngle(top), "deg", "top"));
    if (bottom) {
      const a = ankleAngle(bottom);
      const b = ankleAngle(top);
      put(m("ankleRange", Math.abs(a - b), "deg", "top"));
    }
  }

  const forward = levelled.forward;
  if (forward && forward.knee && forward.pedal) {
    const d = diagnostics.forward!;
    if (d.pxPerMm) {
      const px = (forward.knee.x - forward.pedal.x) * d.facing;
      put(m("kops", px / d.pxPerMm, "mm", "forward"));
    }
  }

  return { measurements, diagnostics };
}

/** Thigh and shank lengths in mm from the bottom frame, when it has a scale. */
export function legSegmentsMm(
  frames: Partial<Record<FrameKind, Pick<FrameData, "landmarks">>>,
  options: MeasureOptions
): { thighMm: number; shankMm: number } | null {
  const l = frames.bottom?.landmarks;
  if (!l || !l.hip || !l.knee || !l.ankle) return null;
  const scale = scaleOf(l, options.crankLengthMm);
  if (!scale) return null;
  return {
    thighMm: distance(l.hip, l.knee) / scale,
    shankMm: distance(l.knee, l.ankle) / scale,
  };
}
