// Object URLs for stored frame images.
//
// A frame's image is an ArrayBuffer held in memory (and IndexedDB). To
// show it we need a blob: URL. One URL is created per buffer, cached,
// and released when the buffer itself is garbage collected, so
// components can call this during render without managing lifetimes.

import type { FrameData } from "@/lib/fit/types";

const cache = new WeakMap<ArrayBuffer, string>();

const registry =
  typeof FinalizationRegistry !== "undefined"
    ? new FinalizationRegistry<string>((url) => URL.revokeObjectURL(url))
    : null;

export function frameUrl(frame: FrameData | undefined | null): string | null {
  if (!frame?.image || typeof URL === "undefined" || typeof Blob === "undefined") return null;
  const existing = cache.get(frame.image);
  if (existing) return existing;
  const url = URL.createObjectURL(new Blob([frame.image], { type: frame.imageType ?? "image/jpeg" }));
  cache.set(frame.image, url);
  registry?.register(frame.image, url);
  return url;
}
