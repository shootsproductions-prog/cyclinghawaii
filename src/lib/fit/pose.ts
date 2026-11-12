// Automatic pose detection, in the browser, on the visitor's device.
//
// Uses Google's MediaPipe Pose Landmarker (Apache-2.0). The WebAssembly
// runtime and the model are served from our own origin (public/pose),
// so detection makes no request to any third party and the image never
// leaves the device. See scripts/sync-pose-assets.mjs.
//
// Everything here is best-effort: if the model cannot load (old
// browser, offline, blocked WebAssembly) the caller falls back to
// placing points by hand, which always works.

import type { PoseLandmarker } from "@mediapipe/tasks-vision";
import { POSE_INDEX } from "./landmarks";
import type { LandmarkId, Landmarks } from "./types";

export const POSE_ASSETS = {
  wasmLoaderPath: "/pose/vision_wasm_internal.js",
  wasmBinaryPath: "/pose/vision_wasm_internal.wasm",
  modelPath: "/pose/pose_landmarker_full.task",
};

/** Give up on loading after this long and let the rider place points by hand. */
const LOAD_TIMEOUT_MS = 60_000;

/** Below this the model is guessing; leave the point for the rider. */
const MIN_VISIBILITY = 0.35;

export type BodySide = "left" | "right";

export interface RawPoseLandmark {
  x: number;
  y: number;
  z: number;
  visibility: number;
}

export interface PoseDetection {
  /** Landmarks for the side of the body nearest the camera, in image pixels. */
  landmarks: Landmarks;
  side: BodySide;
  /** Mean visibility of the points used, 0 to 1. */
  confidence: number;
  /** Points the model was unsure about and left out. */
  skipped: LandmarkId[];
  /** The model's full output, kept so the rider can switch sides without re-running. */
  raw: RawPoseLandmark[];
}

let detectorPromise: Promise<PoseLandmarker> | null = null;

function withTimeout<T>(promise: Promise<T>, ms: number, message: string): Promise<T> {
  return new Promise<T>((resolve, reject) => {
    const timer = setTimeout(() => reject(new Error(message)), ms);
    promise.then(
      (value) => {
        clearTimeout(timer);
        resolve(value);
      },
      (error) => {
        clearTimeout(timer);
        reject(error);
      }
    );
  });
}

async function createDetector(): Promise<PoseLandmarker> {
  if (typeof WebAssembly === "undefined") {
    throw new Error("This browser cannot run the pose model (no WebAssembly).");
  }
  const { FilesetResolver, PoseLandmarker } = await import("@mediapipe/tasks-vision");
  if (!(await FilesetResolver.isSimdSupported())) {
    throw new Error("This browser is too old to run the pose model.");
  }
  return PoseLandmarker.createFromOptions(
    {
      wasmLoaderPath: POSE_ASSETS.wasmLoaderPath,
      wasmBinaryPath: POSE_ASSETS.wasmBinaryPath,
    },
    {
      baseOptions: {
        modelAssetPath: POSE_ASSETS.modelPath,
        // CPU (WebAssembly) rather than GPU: slower, but it behaves the
        // same on every phone, and we only look at a few still frames.
        delegate: "CPU",
      },
      runningMode: "IMAGE",
      numPoses: 1,
      minPoseDetectionConfidence: 0.4,
      minPosePresenceConfidence: 0.4,
    }
  );
}

/** Load the model once and reuse it. A failed load can be retried. */
export function loadPoseDetector(): Promise<PoseLandmarker> {
  if (!detectorPromise) {
    detectorPromise = withTimeout(
      createDetector(),
      LOAD_TIMEOUT_MS,
      "The pose model took too long to load."
    ).catch((error) => {
      detectorPromise = null;
      throw error;
    });
  }
  return detectorPromise;
}

/**
 * Which side of the rider faces the camera. In a side-on shot the far
 * arm and leg are hidden behind the body, so the model reports them as
 * less visible and deeper (larger z).
 */
export function nearSide(raw: RawPoseLandmark[]): BodySide {
  const score = (side: BodySide) => {
    const ids = Object.values(POSE_INDEX[side]) as number[];
    let visibility = 0;
    let depth = 0;
    let n = 0;
    for (const i of ids) {
      const p = raw[i];
      if (!p) continue;
      visibility += p.visibility ?? 0;
      depth += p.z ?? 0;
      n++;
    }
    return n ? { visibility: visibility / n, depth: depth / n } : { visibility: 0, depth: 0 };
  };
  const left = score("left");
  const right = score("right");
  if (Math.abs(left.visibility - right.visibility) > 0.08) {
    return left.visibility > right.visibility ? "left" : "right";
  }
  return left.depth <= right.depth ? "left" : "right";
}

/** Pick one side of the model's output and convert it to image pixels. Pure. */
export function landmarksForSide(
  raw: RawPoseLandmark[],
  side: BodySide,
  width: number,
  height: number
): Pick<PoseDetection, "landmarks" | "confidence" | "skipped"> {
  const landmarks: Landmarks = {};
  const skipped: LandmarkId[] = [];
  let total = 0;
  let count = 0;
  for (const [id, index] of Object.entries(POSE_INDEX[side]) as [LandmarkId, number][]) {
    const p = raw[index];
    if (!p) continue;
    const inFrame = p.x >= 0 && p.x <= 1 && p.y >= 0 && p.y <= 1;
    if (!inFrame || (p.visibility ?? 0) < MIN_VISIBILITY) {
      skipped.push(id);
      continue;
    }
    landmarks[id] = { x: p.x * width, y: p.y * height };
    total += p.visibility ?? 0;
    count++;
  }
  return { landmarks, confidence: count ? total / count : 0, skipped };
}

/**
 * Find the rider in a frame. Returns null when no person is found.
 * Throws only if the model itself cannot load or run.
 */
export async function detectPose(
  source: HTMLCanvasElement | HTMLImageElement | ImageBitmap,
  width: number,
  height: number
): Promise<PoseDetection | null> {
  const detector = await loadPoseDetector();
  const result = detector.detect(source);
  const first = result.landmarks?.[0];
  if (!first || first.length < 33) return null;
  const raw: RawPoseLandmark[] = first.map((p) => ({
    x: p.x,
    y: p.y,
    z: p.z,
    visibility: p.visibility ?? 0,
  }));
  const side = nearSide(raw);
  return { ...landmarksForSide(raw, side, width, height), side, raw };
}
