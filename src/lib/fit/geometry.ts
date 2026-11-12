// Pure 2D geometry for the bike fit tool. No DOM, no state.
//
// Coordinates are image pixels: x grows to the right, y grows DOWNWARD.
// Angles are in degrees.

import type { Point } from "./types";

const RAD = Math.PI / 180;

export function distance(a: Point, b: Point): number {
  return Math.hypot(a.x - b.x, a.y - b.y);
}

/**
 * The included angle at `vertex` between the rays to `a` and `c`,
 * from 0 to 180 degrees. Returns NaN if either ray has no length.
 */
export function angleAt(a: Point, vertex: Point, c: Point): number {
  const v1x = a.x - vertex.x;
  const v1y = a.y - vertex.y;
  const v2x = c.x - vertex.x;
  const v2y = c.y - vertex.y;
  const m1 = Math.hypot(v1x, v1y);
  const m2 = Math.hypot(v2x, v2y);
  if (m1 === 0 || m2 === 0) return NaN;
  const cos = (v1x * v2x + v1y * v2y) / (m1 * m2);
  return Math.acos(Math.min(1, Math.max(-1, cos))) / RAD;
}

/**
 * Remove camera tilt. `tiltDeg` is the angle a truly level line makes
 * in the image, positive when it rises toward the right edge. After
 * levelling, that line is horizontal.
 */
export function levelPoint(p: Point, tiltDeg: number): Point {
  if (!tiltDeg) return p;
  const t = tiltDeg * RAD;
  const cos = Math.cos(t);
  const sin = Math.sin(t);
  return { x: p.x * cos - p.y * sin, y: p.x * sin + p.y * cos };
}

/**
 * Angle of the segment from `from` to `to` above the horizontal,
 * 0 (flat) to 90 (vertical). Direction along x is ignored, so it
 * reads the same whichever way the rider faces. Negative if `to`
 * is below `from`.
 */
export function angleAboveHorizontal(from: Point, to: Point): number {
  const dx = Math.abs(to.x - from.x);
  const dy = from.y - to.y; // image y is down, so up is positive here
  if (dx === 0 && dy === 0) return NaN;
  return Math.atan2(dy, dx) / RAD;
}

/**
 * Crank position as a clock angle seen from the side the rider's
 * forward direction defines: 0 = pedal straight up (12 o'clock),
 * 90 = pedal forward (3 o'clock), 180 = straight down (6 o'clock),
 * 270 = pedal back (9 o'clock).
 */
export function crankClockAngle(bb: Point, pedal: Point, facing: 1 | -1): number {
  const forward = (pedal.x - bb.x) * facing;
  const up = bb.y - pedal.y;
  if (forward === 0 && up === 0) return NaN;
  const deg = Math.atan2(forward, up) / RAD;
  return (deg + 360) % 360;
}

/** Smallest signed difference a - b between two clock angles, in -180..180. */
export function clockDifference(a: number, b: number): number {
  return ((a - b + 540) % 360) - 180;
}

/**
 * Length of the straight line from hip to ankle for a leg with the
 * given thigh and shank lengths and knee flexion (0 = straight leg).
 * Law of cosines on the included knee angle (180 - flexion).
 */
export function legExtension(thigh: number, shank: number, kneeFlexionDeg: number): number {
  const included = (180 - kneeFlexionDeg) * RAD;
  return Math.sqrt(
    Math.max(0, thigh * thigh + shank * shank - 2 * thigh * shank * Math.cos(included))
  );
}

/**
 * How far the hip-to-ankle distance has to change to move the knee
 * from `fromFlexionDeg` to `toFlexionDeg`, in the same unit as the
 * segment lengths. Positive means the leg gets longer (saddle goes up).
 *
 * This is the geometric basis for "raise the saddle N mm": at the
 * bottom of the stroke the saddle moves almost exactly along the
 * hip-to-ankle line, so the saddle change equals the change in leg
 * extension, assuming the ankle holds the same angle.
 */
export function extensionChangeForKnee(
  thigh: number,
  shank: number,
  fromFlexionDeg: number,
  toFlexionDeg: number
): number {
  return legExtension(thigh, shank, toFlexionDeg) - legExtension(thigh, shank, fromFlexionDeg);
}

/** Rotate `p` about `origin` by `deg`, counter-clockwise as seen on screen. */
export function rotateAbout(p: Point, origin: Point, deg: number): Point {
  const t = -deg * RAD; // screen y is down, so flip the sign
  const cos = Math.cos(t);
  const sin = Math.sin(t);
  const dx = p.x - origin.x;
  const dy = p.y - origin.y;
  return { x: origin.x + dx * cos - dy * sin, y: origin.y + dx * sin + dy * cos };
}

export function round(value: number, digits = 0): number {
  const f = Math.pow(10, digits);
  return Math.round(value * f) / f;
}
