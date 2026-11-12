"use client";

// A frame with its lines drawn on, read-only. Used for thumbnails and
// for the before/after comparison.

import type { Analysis } from "@/lib/fit/analyze";
import { FRAMES } from "@/lib/fit/landmarks";
import type { FrameData } from "@/lib/fit/types";
import FigureOverlay from "./FigureOverlay";
import { frameUrl } from "./frameUrl";

export default function FrameView({
  frame,
  analysis,
  /** Rough on-screen width in px, used only to size strokes and labels. */
  displayWidth = 480,
  compact = false,
  className = "",
}: {
  frame: FrameData;
  analysis?: Analysis;
  displayWidth?: number;
  /** Thumbnail: skeleton only, no angle labels. */
  compact?: boolean;
  className?: string;
}) {
  const url = frameUrl(frame);
  const unit = frame.width / displayWidth;
  return (
    <div
      className={`relative w-full overflow-hidden rounded-lg bg-surface border border-border ${className}`}
      style={{ aspectRatio: `${frame.width} / ${frame.height}` }}
    >
      {url ? (
        // eslint-disable-next-line @next/next/no-img-element -- local blob: URL; next/image cannot optimise it
        <img
          src={url}
          alt={`${FRAMES[frame.kind].title} frame with joint angles drawn on`}
          className="absolute inset-0 w-full h-full object-fill"
          draggable={false}
        />
      ) : (
        <div className="absolute inset-0 flex items-center justify-center text-xs text-mist text-center px-3">
          Picture not included in this session. The points and angles are still here.
        </div>
      )}
      <svg
        viewBox={`0 0 ${frame.width} ${frame.height}`}
        className="absolute inset-0 w-full h-full pointer-events-none"
        aria-hidden="true"
      >
        <FigureOverlay
          kind={frame.kind}
          landmarks={frame.landmarks}
          unit={unit}
          measurements={analysis?.measurements}
          findings={analysis?.findings}
          compact={compact}
        />
      </svg>
    </div>
  );
}
