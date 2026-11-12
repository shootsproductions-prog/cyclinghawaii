// A synthetic rider built from known joint angles (forward kinematics).
//
// Two jobs:
//   1. Unit tests: build a figure with known angles, measure it, and
//      check we get the same angles back.
//   2. The "try it with a sample rider" demo on /fit, so a visitor can
//      see the whole flow without a photo.
//
// Pure. Drawing the figure to a canvas lives in the component layer.

import type { FrameKind, Landmarks, Point } from "./types";

export interface SyntheticPose {
  /** Torso above horizontal. */
  torsoDeg: number;
  /** Hip-shoulder-elbow. */
  shoulderDeg: number;
  /** 0 = locked straight. */
  elbowFlexionDeg: number;
  /** Shoulder-hip-knee. */
  hipDeg: number;
  /** 0 = straight leg. */
  kneeFlexionDeg: number;
  /** Knee-ankle-toe. */
  ankleDeg: number;
  /** Crank clock angle: 0 = 12 o'clock, 90 = 3 o'clock, 180 = 6 o'clock. */
  crankClockDeg: number;
}

export interface SyntheticBody {
  /** Segment lengths in pixels. */
  torso: number;
  upperArm: number;
  forearm: number;
  thigh: number;
  shank: number;
  foot: number;
  crank: number;
}

export interface SyntheticOptions {
  hip: Point;
  facing: 1 | -1;
  body: SyntheticBody;
  /** Rotate the whole figure, as a tilted camera would. Same sign as SessionSettings.tiltDeg. */
  tiltDeg?: number;
}

const RAD = Math.PI / 180;

/**
 * Body proportions for a rider about 1.78 m tall with 172.5 mm cranks,
 * at `pxPerMm` image pixels per millimetre.
 */
export function defaultBody(pxPerMm: number): SyntheticBody {
  return {
    torso: 520 * pxPerMm,
    upperArm: 300 * pxPerMm,
    forearm: 265 * pxPerMm,
    thigh: 430 * pxPerMm,
    shank: 425 * pxPerMm,
    foot: 190 * pxPerMm,
    crank: 172.5 * pxPerMm,
  };
}

/**
 * Place every landmark from the joint angles. Works in a y-up frame
 * with the rider facing +x, then flips to image coordinates.
 */
export function buildFigure(pose: SyntheticPose, options: SyntheticOptions): Required<Landmarks> {
  const { body, facing, hip } = options;
  // Direction angles, counter-clockwise from +x, y up.
  const torsoDir = pose.torsoDeg;
  const upperArmDir = torsoDir + 180 + pose.shoulderDeg;
  const forearmDir = upperArmDir + pose.elbowFlexionDeg;
  const thighDir = torsoDir - pose.hipDeg;
  const shankDir = thighDir - pose.kneeFlexionDeg;
  const footDir = shankDir + 180 - pose.ankleDeg;

  const step = (from: Point, dirDeg: number, length: number): Point => ({
    x: from.x + Math.cos(dirDeg * RAD) * length,
    y: from.y + Math.sin(dirDeg * RAD) * length,
  });

  const origin: Point = { x: 0, y: 0 };
  const shoulder = step(origin, torsoDir, body.torso);
  const elbow = step(shoulder, upperArmDir, body.upperArm);
  const wrist = step(elbow, forearmDir, body.forearm);
  const knee = step(origin, thighDir, body.thigh);
  const ankle = step(knee, shankDir, body.shank);
  const toe = step(ankle, footDir, body.foot);
  // Heel: behind and below the ankle, relative to the foot.
  const heel = step(ankle, footDir + 215, body.foot * 0.36);
  // Pedal axle under the ball of the foot.
  const ball = step(ankle, footDir, body.foot * 0.68);
  const pedal = step(ball, footDir - 90, body.foot * 0.12);
  const bb: Point = {
    x: pedal.x - Math.sin(pose.crankClockDeg * RAD) * body.crank,
    y: pedal.y - Math.cos(pose.crankClockDeg * RAD) * body.crank,
  };

  const tilt = (options.tiltDeg ?? 0) * RAD;
  const toImage = (p: Point): Point => {
    // Mirror for facing, flip y, then apply camera tilt about the hip.
    const x = p.x * facing;
    const y = -p.y;
    // Inverse of geometry.levelPoint, so levelling recovers the figure.
    const xr = x * Math.cos(tilt) + y * Math.sin(tilt);
    const yr = -x * Math.sin(tilt) + y * Math.cos(tilt);
    return { x: hip.x + xr, y: hip.y + yr };
  };

  return {
    shoulder: toImage(shoulder),
    elbow: toImage(elbow),
    wrist: toImage(wrist),
    hip: toImage(origin),
    knee: toImage(knee),
    ankle: toImage(ankle),
    heel: toImage(heel),
    toe: toImage(toe),
    pedal: toImage(pedal),
    bb: toImage(bb),
  };
}

/**
 * The knee offset the measure module should report for a figure:
 * knee ahead (+) or behind (-) the pedal axle, in the figure's pixels,
 * for a level camera.
 */
export function figureKopsPx(pose: SyntheticPose, options: SyntheticOptions): number {
  const level = buildFigure(pose, { ...options, tiltDeg: 0 });
  return (level.knee.x - level.pedal.x) * options.facing;
}

// ───────────────────── Sample rider on a fixed bike ─────────────────────
//
// For the demo the bike must not move between frames, so this builder
// works the other way round: saddle and crank are fixed, the foot
// follows the pedal, and the knee falls where the leg lengths put it
// (two-circle intersection). The saddle is set deliberately low so the
// demo has something to coach.

const CLOCK: Record<FrameKind, number> = { bottom: 180, forward: 90, top: 0 };

/**
 * Direction of the ankle-to-toe line through the stroke, in degrees
 * below horizontal. The ankle bone sits well above the sole, so this
 * line points about 20 degrees down even with the shoe level; the rest
 * is the heel lifting.
 */
const FOOT_PITCH: Record<FrameKind, number> = { bottom: 38, forward: 27, top: 42 };

const SEAT_TUBE_DEG = 73;

export interface SampleRider {
  /** Knee flexion the saddle height is solved for, at the bottom of the stroke. */
  kneeFlexionAtBottomDeg: number;
  torsoDeg: number;
  shoulderDeg: number;
  elbowFlexionDeg: number;
}

export const SAMPLE_RIDER: SampleRider = {
  kneeFlexionAtBottomDeg: 47,
  torsoDeg: 44,
  shoulderDeg: 88,
  elbowFlexionDeg: 22,
};

function ankleFor(bb: Point, body: SyntheticBody, kind: FrameKind): { ankle: Point; pedal: Point; footDir: number } {
  const clock = CLOCK[kind] * RAD;
  const pedal: Point = { x: bb.x + Math.sin(clock) * body.crank, y: bb.y + Math.cos(clock) * body.crank };
  const footDir = -FOOT_PITCH[kind];
  // Reverse of the pedal placement in buildFigure.
  const ball: Point = {
    x: pedal.x - Math.cos((footDir - 90) * RAD) * body.foot * 0.12,
    y: pedal.y - Math.sin((footDir - 90) * RAD) * body.foot * 0.12,
  };
  const ankle: Point = {
    x: ball.x - Math.cos(footDir * RAD) * body.foot * 0.68,
    y: ball.y - Math.sin(footDir * RAD) * body.foot * 0.68,
  };
  return { ankle, pedal, footDir };
}

/**
 * Landmarks for the sample rider at one crank position, in image
 * pixels, with the crank centre at `bb`. Returns null if the leg
 * cannot reach the pedal (which cannot happen with the defaults).
 */
export function buildSampleFrame(
  kind: FrameKind,
  options: { bb: Point; facing: 1 | -1; body: SyntheticBody; rider?: SampleRider }
): Required<Landmarks> | null {
  const { body, facing } = options;
  const rider = options.rider ?? SAMPLE_RIDER;
  // y-up frame, rider facing +x, crank centre at the origin.
  const origin: Point = { x: 0, y: 0 };

  // Saddle height: slide the hip along the seat tube until the leg at
  // the bottom of the stroke has the requested knee flexion.
  const bottomAnkle = ankleFor(origin, body, "bottom").ankle;
  const included = (180 - rider.kneeFlexionAtBottomDeg) * RAD;
  const reach = Math.sqrt(
    body.thigh * body.thigh + body.shank * body.shank - 2 * body.thigh * body.shank * Math.cos(included)
  );
  const along: Point = { x: -Math.cos(SEAT_TUBE_DEG * RAD), y: Math.sin(SEAT_TUBE_DEG * RAD) };
  let lo = 0;
  let hi = (body.thigh + body.shank) * 1.5;
  for (let i = 0; i < 60; i++) {
    const mid = (lo + hi) / 2;
    const d = Math.hypot(along.x * mid - bottomAnkle.x, along.y * mid - bottomAnkle.y);
    if (d < reach) lo = mid;
    else hi = mid;
  }
  const hip: Point = { x: along.x * lo, y: along.y * lo };

  const { ankle, pedal, footDir } = ankleFor(origin, body, kind);
  const dx = ankle.x - hip.x;
  const dy = ankle.y - hip.y;
  const d = Math.hypot(dx, dy);
  if (d > body.thigh + body.shank || d < Math.abs(body.thigh - body.shank)) return null;
  // Two-circle intersection; the knee is the solution in front of the hip-ankle line.
  const a = (body.thigh * body.thigh - body.shank * body.shank + d * d) / (2 * d);
  const h = Math.sqrt(Math.max(0, body.thigh * body.thigh - a * a));
  const mx = hip.x + (a * dx) / d;
  const my = hip.y + (a * dy) / d;
  const k1: Point = { x: mx + (h * dy) / d, y: my - (h * dx) / d };
  const k2: Point = { x: mx - (h * dy) / d, y: my + (h * dx) / d };
  const knee = k1.x > k2.x ? k1 : k2;

  const step = (from: Point, dirDeg: number, length: number): Point => ({
    x: from.x + Math.cos(dirDeg * RAD) * length,
    y: from.y + Math.sin(dirDeg * RAD) * length,
  });
  const shoulder = step(hip, rider.torsoDeg, body.torso);
  const upperArmDir = rider.torsoDeg + 180 + rider.shoulderDeg;
  const elbow = step(shoulder, upperArmDir, body.upperArm);
  const wrist = step(elbow, upperArmDir + rider.elbowFlexionDeg, body.forearm);
  const toe = step(ankle, footDir, body.foot);
  const heel = step(ankle, footDir + 215, body.foot * 0.36);

  const toImage = (p: Point): Point => ({ x: options.bb.x + p.x * facing, y: options.bb.y - p.y });
  return {
    shoulder: toImage(shoulder),
    elbow: toImage(elbow),
    wrist: toImage(wrist),
    hip: toImage(hip),
    knee: toImage(knee),
    ankle: toImage(ankle),
    heel: toImage(heel),
    toe: toImage(toe),
    pedal: toImage(pedal),
    bb: toImage(origin),
  };
}
