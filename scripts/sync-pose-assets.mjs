#!/usr/bin/env node
// Copies the pose-detection runtime for the /fit tool into public/pose.
//
// The fit tool runs Google's MediaPipe Pose Landmarker in the visitor's
// browser. It needs three files served from our own origin:
//
//   public/pose/vision_wasm_internal.js     WebAssembly loader  } from the
//   public/pose/vision_wasm_internal.wasm   WebAssembly runtime } npm package
//   public/pose/pose_landmarker_full.task   the pose model (downloaded)
//
// These are committed to the repo so a deploy has no build-time or
// run-time dependency on a third-party CDN. The loader and runtime MUST
// come from the same version of @mediapipe/tasks-vision that is
// installed, so re-run this after changing that version:
//
//   node scripts/sync-pose-assets.mjs            copy runtime, check model
//   node scripts/sync-pose-assets.mjs --model    also (re)download the model
//
// src/lib/fit/__tests__/pose-assets.test.ts fails if they drift apart.

import { createHash } from "node:crypto";
import { copyFileSync, existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const pkgDir = join(root, "node_modules", "@mediapipe", "tasks-vision");
const outDir = join(root, "public", "pose");

const MODEL_FILE = "pose_landmarker_full.task";
const MODEL_URL =
  "https://storage.googleapis.com/mediapipe-models/pose_landmarker/pose_landmarker_full/float16/latest/pose_landmarker_full.task";
const MODEL_SHA256 = "4eaa5eb7a98365221087693fcc286334cf0858e2eb6e15b506aa4a7ecdcec4ad";

const sha256 = (path) => createHash("sha256").update(readFileSync(path)).digest("hex");

if (!existsSync(pkgDir)) {
  console.error("@mediapipe/tasks-vision is not installed. Run npm install first.");
  process.exit(1);
}

mkdirSync(outDir, { recursive: true });
const version = JSON.parse(readFileSync(join(pkgDir, "package.json"), "utf8")).version;

// Only the SIMD build. Every browser Next.js 16 supports has WebAssembly
// SIMD; anything older falls back to placing points by hand.
for (const file of ["vision_wasm_internal.js", "vision_wasm_internal.wasm"]) {
  copyFileSync(join(pkgDir, "wasm", file), join(outDir, file));
  console.log(`copied ${file}`);
}

const modelPath = join(outDir, MODEL_FILE);
if (process.argv.includes("--model") || !existsSync(modelPath)) {
  console.log(`downloading ${MODEL_FILE} ...`);
  const res = await fetch(MODEL_URL);
  if (!res.ok) {
    console.error(`Model download failed: HTTP ${res.status}`);
    process.exit(1);
  }
  writeFileSync(modelPath, Buffer.from(await res.arrayBuffer()));
}

const actual = sha256(modelPath);
if (actual !== MODEL_SHA256) {
  console.warn(
    `Model checksum differs from the one this script was written against.\n  expected ${MODEL_SHA256}\n  actual   ${actual}\nGoogle may have published a new model. Test pose detection on /fit, then update MODEL_SHA256.`
  );
}

writeFileSync(
  join(outDir, "manifest.json"),
  JSON.stringify(
    {
      package: "@mediapipe/tasks-vision",
      version,
      model: MODEL_FILE,
      modelSha256: actual,
      wasmSha256: sha256(join(outDir, "vision_wasm_internal.wasm")),
    },
    null,
    2
  ) + "\n"
);
console.log(`public/pose is in sync with @mediapipe/tasks-vision ${version}`);
