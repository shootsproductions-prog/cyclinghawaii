// Landmark definitions: what each point is, where to put it, which
// frames need it, and how it maps to the pose model's output.

import type { FrameKind, LandmarkId } from "./types";

export interface LandmarkDef {
  id: LandmarkId;
  label: string;
  /** Where to place it, in words a rider can follow without anatomy training. */
  where: string;
  /** True for bike points the pose model cannot find. */
  manualOnly: boolean;
}

export const LANDMARKS: Record<LandmarkId, LandmarkDef> = {
  shoulder: {
    id: "shoulder",
    label: "Shoulder",
    where: "The bony point on the outside of the shoulder, where the arm meets the body.",
    manualOnly: false,
  },
  elbow: {
    id: "elbow",
    label: "Elbow",
    where: "The outside of the elbow joint, at the centre of the bend.",
    manualOnly: false,
  },
  wrist: {
    id: "wrist",
    label: "Wrist",
    where: "The outside of the wrist, on the bony bump on the little-finger side.",
    manualOnly: false,
  },
  hip: {
    id: "hip",
    label: "Hip",
    where:
      "The bony bump on the side of the hip (greater trochanter) that you can feel rotate when you lift your knee. Lower than most people guess.",
    manualOnly: false,
  },
  knee: {
    id: "knee",
    label: "Knee",
    where: "The outside of the knee at the centre of the joint, not the front of the kneecap.",
    manualOnly: false,
  },
  ankle: {
    id: "ankle",
    label: "Ankle",
    where: "The bony bump on the outside of the ankle.",
    manualOnly: false,
  },
  heel: {
    id: "heel",
    label: "Heel",
    where: "The back of the shoe at the bottom of the heel.",
    manualOnly: false,
  },
  toe: {
    id: "toe",
    label: "Toe",
    where: "The front tip of the shoe.",
    manualOnly: false,
  },
  pedal: {
    id: "pedal",
    label: "Pedal axle",
    where: "The centre of the pedal axle, where the pedal threads into the crank arm.",
    manualOnly: true,
  },
  bb: {
    id: "bb",
    label: "Crank centre",
    where: "The centre of the crank, where the crank arm bolts to the bike (bottom bracket).",
    manualOnly: true,
  },
};

/** Drawing and placement order. Body first (top to bottom), then bike. */
export const LANDMARK_ORDER: LandmarkId[] = [
  "shoulder",
  "elbow",
  "wrist",
  "hip",
  "knee",
  "ankle",
  "heel",
  "toe",
  "pedal",
  "bb",
];

export interface FrameDef {
  kind: FrameKind;
  title: string;
  clock: string;
  /** The crank clock angle this frame should show (see geometry.crankClockAngle). */
  targetClockDeg: number;
  /** What to look for when choosing the frame. */
  pick: string;
  /** Points needed before this frame can contribute any measurement. */
  required: LandmarkId[];
  /** Points that add measurements or checks but can be skipped. */
  optional: LandmarkId[];
  measures: string;
}

export const FRAMES: Record<FrameKind, FrameDef> = {
  bottom: {
    kind: "bottom",
    title: "Bottom of the stroke",
    clock: "6 o'clock",
    targetClockDeg: 180,
    pick: "The near-side pedal at its lowest point, leg at its longest. Step frame by frame until the knee stops opening.",
    required: ["shoulder", "elbow", "wrist", "hip", "knee", "ankle"],
    optional: ["pedal", "bb", "toe", "heel"],
    measures: "Saddle height (knee), torso, shoulder, elbow, ankle",
  },
  forward: {
    kind: "forward",
    title: "Pedal forward",
    clock: "3 o'clock",
    targetClockDeg: 90,
    pick: "The near-side crank arm level with the ground, pedal pointing forward.",
    required: ["knee", "pedal", "bb"],
    optional: ["hip", "ankle", "toe", "heel"],
    measures: "Saddle fore-aft (knee over the pedal axle)",
  },
  top: {
    kind: "top",
    title: "Top of the stroke",
    clock: "12 o'clock",
    targetClockDeg: 0,
    pick: "The near-side pedal at its highest point, knee at its most bent.",
    required: ["shoulder", "hip", "knee", "ankle"],
    optional: ["toe", "pedal", "bb", "heel"],
    measures: "Knee bend and hip angle at the top",
  },
};

export const FRAME_ORDER: FrameKind[] = ["bottom", "forward", "top"];

/** Lines drawn between landmarks to show the rider. */
export const SKELETON: [LandmarkId, LandmarkId][] = [
  ["wrist", "elbow"],
  ["elbow", "shoulder"],
  ["shoulder", "hip"],
  ["hip", "knee"],
  ["knee", "ankle"],
  ["ankle", "heel"],
  ["ankle", "toe"],
  ["heel", "toe"],
  ["bb", "pedal"],
];

/**
 * MediaPipe Pose Landmarker indices for each side of the body.
 * https://ai.google.dev/edge/mediapipe/solutions/vision/pose_landmarker
 */
export const POSE_INDEX: Record<"left" | "right", Partial<Record<LandmarkId, number>>> = {
  left: { shoulder: 11, elbow: 13, wrist: 15, hip: 23, knee: 25, ankle: 27, heel: 29, toe: 31 },
  right: { shoulder: 12, elbow: 14, wrist: 16, hip: 24, knee: 26, ankle: 28, heel: 30, toe: 32 },
};

export function missingRequired(
  kind: FrameKind,
  landmarks: Partial<Record<LandmarkId, unknown>>
): LandmarkId[] {
  return FRAMES[kind].required.filter((id) => !landmarks[id]);
}

/**
 * Next point to place when tapping through a frame by hand: required
 * points first in body order, then the optional ones in the order the
 * frame lists them (most useful first).
 */
export function nextToPlace(
  kind: FrameKind,
  landmarks: Partial<Record<LandmarkId, unknown>>
): LandmarkId | null {
  const def = FRAMES[kind];
  const requiredNext = LANDMARK_ORDER.find(
    (id) => def.required.includes(id) && !landmarks[id]
  );
  if (requiredNext) return requiredNext;
  return def.optional.find((id) => !landmarks[id]) ?? null;
}

/** Every point a frame can use, required first. */
export function frameLandmarks(kind: FrameKind): LandmarkId[] {
  const def = FRAMES[kind];
  return [...LANDMARK_ORDER.filter((id) => def.required.includes(id)), ...def.optional];
}
