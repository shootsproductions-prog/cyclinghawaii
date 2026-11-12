// Guards the vendored pose-detection files in public/pose.
//
// The WebAssembly runtime there must come from the same version of
// @mediapipe/tasks-vision that is installed, or detection breaks in
// ways that are hard to diagnose. If this fails after a dependency
// bump, run: node scripts/sync-pose-assets.mjs

import { createHash } from "node:crypto";
import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { POSE_INDEX } from "../landmarks";
import { POSE_ASSETS, landmarksForSide, nearSide, type RawPoseLandmark } from "../pose";

const root = process.cwd();
const publicDir = join(root, "public");
const sha256 = (path: string) => createHash("sha256").update(readFileSync(path)).digest("hex");

describe("vendored pose assets", () => {
  it("has every file the detector asks for", () => {
    for (const url of Object.values(POSE_ASSETS)) {
      expect(existsSync(join(publicDir, url)), url).toBe(true);
    }
  });

  it("matches the installed @mediapipe/tasks-vision version", () => {
    const manifest = JSON.parse(readFileSync(join(publicDir, "pose", "manifest.json"), "utf8"));
    const installed = JSON.parse(
      readFileSync(join(root, "node_modules", "@mediapipe", "tasks-vision", "package.json"), "utf8")
    );
    expect(manifest.version).toBe(installed.version);
    expect(sha256(join(publicDir, POSE_ASSETS.wasmBinaryPath))).toBe(manifest.wasmSha256);
    expect(sha256(join(publicDir, POSE_ASSETS.wasmBinaryPath))).toBe(
      sha256(join(root, "node_modules", "@mediapipe", "tasks-vision", "wasm", "vision_wasm_internal.wasm"))
    );
    expect(sha256(join(publicDir, POSE_ASSETS.modelPath))).toBe(manifest.modelSha256);
  });
});

/** A fake model output: 33 landmarks, with one side clearly nearer the camera. */
function fakePose(near: "left" | "right"): RawPoseLandmark[] {
  const raw: RawPoseLandmark[] = Array.from({ length: 33 }, () => ({ x: 0.5, y: 0.5, z: 0, visibility: 0.5 }));
  for (const side of ["left", "right"] as const) {
    const isNear = side === near;
    for (const index of Object.values(POSE_INDEX[side]) as number[]) {
      raw[index] = {
        x: 0.2 + index * 0.02,
        y: 0.1 + index * 0.025,
        z: isNear ? -0.2 : 0.3,
        visibility: isNear ? 0.95 : 0.3,
      };
    }
  }
  return raw;
}

describe("choosing the side of the body nearest the camera", () => {
  it("picks the more visible side", () => {
    expect(nearSide(fakePose("left"))).toBe("left");
    expect(nearSide(fakePose("right"))).toBe("right");
  });

  it("falls back to depth when both sides look equally visible", () => {
    const raw = fakePose("right").map((p) => ({ ...p, visibility: 0.9 }));
    expect(nearSide(raw)).toBe("right");
  });
});

describe("converting model output to landmarks", () => {
  it("scales normalised coordinates to image pixels", () => {
    const raw = fakePose("left");
    const { landmarks, confidence, skipped } = landmarksForSide(raw, "left", 1600, 1200);
    const knee = raw[POSE_INDEX.left.knee!];
    expect(landmarks.knee).toEqual({ x: knee.x * 1600, y: knee.y * 1200 });
    expect(Object.keys(landmarks).sort()).toEqual(
      ["ankle", "elbow", "heel", "hip", "knee", "shoulder", "toe", "wrist"].sort()
    );
    expect(confidence).toBeCloseTo(0.95, 6);
    expect(skipped).toHaveLength(0);
  });

  it("leaves out points the model could not see or that fall outside the frame", () => {
    const raw = fakePose("left");
    raw[POSE_INDEX.left.wrist!] = { x: 0.4, y: 0.4, z: 0, visibility: 0.1 };
    raw[POSE_INDEX.left.toe!] = { x: 1.2, y: 0.9, z: 0, visibility: 0.9 };
    const { landmarks, skipped } = landmarksForSide(raw, "left", 1000, 1000);
    expect(landmarks.wrist).toBeUndefined();
    expect(landmarks.toe).toBeUndefined();
    expect(skipped.sort()).toEqual(["toe", "wrist"]);
  });

  it("never invents bike points", () => {
    const { landmarks } = landmarksForSide(fakePose("left"), "left", 1000, 1000);
    expect(landmarks.pedal).toBeUndefined();
    expect(landmarks.bb).toBeUndefined();
  });
});
