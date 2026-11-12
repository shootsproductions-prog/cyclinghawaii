// Browser-only image helpers for the fit tool: turn a photo or a video
// frame into a stored, reasonably sized JPEG. Nothing here uploads
// anything; it is all canvas work on the device.

import type { FrameData, FrameKind } from "./types";

/** Longest side of a stored frame. Big enough to place points precisely, small enough to store dozens. */
export const MAX_FRAME_SIDE = 1600;

const JPEG_QUALITY = 0.88;

export interface DrawableSource {
  source: CanvasImageSource;
  width: number;
  height: number;
}

/** Decode an image file, honouring the rotation phones store in EXIF. */
export async function decodeImageFile(file: Blob): Promise<DrawableSource> {
  if (typeof createImageBitmap === "function") {
    try {
      const bitmap = await createImageBitmap(file, { imageOrientation: "from-image" });
      return { source: bitmap, width: bitmap.width, height: bitmap.height };
    } catch {
      // Fall through to the <img> path (some formats only decode there).
    }
  }
  const url = URL.createObjectURL(file);
  try {
    const img = new Image();
    img.decoding = "async";
    img.src = url;
    await img.decode();
    return { source: img, width: img.naturalWidth, height: img.naturalHeight };
  } catch {
    throw new Error("This browser could not open that image. Try a JPEG or PNG.");
  } finally {
    URL.revokeObjectURL(url);
  }
}

/** Draw a source onto a new canvas, scaled so its longest side fits MAX_FRAME_SIDE. */
export function drawToCanvas(drawable: DrawableSource): HTMLCanvasElement {
  const scale = Math.min(1, MAX_FRAME_SIDE / Math.max(drawable.width, drawable.height));
  const canvas = document.createElement("canvas");
  canvas.width = Math.max(1, Math.round(drawable.width * scale));
  canvas.height = Math.max(1, Math.round(drawable.height * scale));
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Could not prepare the image.");
  ctx.drawImage(drawable.source, 0, 0, canvas.width, canvas.height);
  return canvas;
}

export function canvasToBlob(canvas: HTMLCanvasElement, type = "image/jpeg"): Promise<Blob> {
  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => (blob ? resolve(blob) : reject(new Error("Could not save the frame."))),
      type,
      JPEG_QUALITY
    );
  });
}

/** A stored frame with no landmarks yet. */
export async function frameFromCanvas(
  canvas: HTMLCanvasElement,
  kind: FrameKind,
  source: FrameData["source"]
): Promise<FrameData> {
  const type = source === "sample" ? "image/png" : "image/jpeg";
  const blob = await canvasToBlob(canvas, type);
  return {
    kind,
    width: canvas.width,
    height: canvas.height,
    landmarks: {},
    source,
    image: await blob.arrayBuffer(),
    imageType: type,
  };
}

export async function frameFromImageFile(file: Blob, kind: FrameKind): Promise<{ frame: FrameData; canvas: HTMLCanvasElement }> {
  const canvas = drawToCanvas(await decodeImageFile(file));
  return { frame: await frameFromCanvas(canvas, kind, "photo"), canvas };
}

/** Grab the frame a <video> element is currently showing. */
export function canvasFromVideo(video: HTMLVideoElement): HTMLCanvasElement {
  if (!video.videoWidth || !video.videoHeight) {
    throw new Error("The video has not loaded a frame yet.");
  }
  return drawToCanvas({ source: video, width: video.videoWidth, height: video.videoHeight });
}

/** Rebuild a canvas from a stored frame (for pose detection on a saved session). */
export async function canvasFromFrame(frame: FrameData): Promise<HTMLCanvasElement | null> {
  if (!frame.image) return null;
  const blob = new Blob([frame.image], { type: frame.imageType ?? "image/jpeg" });
  return drawToCanvas(await decodeImageFile(blob));
}

export function frameObjectUrl(frame: FrameData): string | null {
  if (!frame.image) return null;
  return URL.createObjectURL(new Blob([frame.image], { type: frame.imageType ?? "image/jpeg" }));
}
