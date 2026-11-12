"use client";

// Scrub a short video and pull out the three frames the fit needs.
// Timing a still photo at the exact bottom of the pedal stroke while
// balancing on rollers is close to impossible; stepping through a
// video is the realistic way to get it.
//
// The video is opened with a local blob: URL. It is never uploaded.

import { useEffect, useRef, useState } from "react";
import { Badge, Button } from "@/components/ToolUi";
import { canvasFromVideo } from "@/lib/fit/image";
import { FRAMES, FRAME_ORDER } from "@/lib/fit/landmarks";
import type { FrameKind } from "@/lib/fit/types";

interface Props {
  file: File;
  captured: Partial<Record<FrameKind, boolean>>;
  onCapture: (kind: FrameKind, canvas: HTMLCanvasElement) => void | Promise<void>;
  onClose: () => void;
}

/** One frame of ordinary phone video. High-frame-rate clips just step twice per shown frame. */
const FRAME_STEP = 1 / 30;

function formatTime(t: number): string {
  if (!Number.isFinite(t)) return "0.00";
  return t.toFixed(2);
}

function waitForSeek(video: HTMLVideoElement): Promise<void> {
  if (!video.seeking && video.readyState >= 2) return Promise.resolve();
  return new Promise((resolve) => {
    const done = () => {
      video.removeEventListener("seeked", done);
      video.removeEventListener("loadeddata", done);
      resolve();
    };
    video.addEventListener("seeked", done);
    video.addEventListener("loadeddata", done);
    // Never hang the UI on a browser that swallows the event.
    setTimeout(done, 1500);
  });
}

export default function VideoPicker({ file, captured, onCapture, onClose }: Props) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [url, setUrl] = useState<string | null>(null);
  const [duration, setDuration] = useState(0);
  const [time, setTime] = useState(0);
  const [playing, setPlaying] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState<FrameKind | null>(null);

  // Object URL lifecycle follows the file.
  useEffect(() => {
    const objectUrl = URL.createObjectURL(file);
    setUrl(objectUrl);
    setError(null);
    setDuration(0);
    setTime(0);
    setPlaying(false);
    return () => URL.revokeObjectURL(objectUrl);
  }, [file]);

  const seek = (t: number) => {
    const video = videoRef.current;
    if (!video || !duration) return;
    video.pause();
    const clamped = Math.min(Math.max(0, t), Math.max(0, duration - 0.001));
    video.currentTime = clamped;
    setTime(clamped);
  };

  const togglePlay = () => {
    const video = videoRef.current;
    if (!video) return;
    if (video.paused) {
      video.playbackRate = 0.25;
      void video.play().catch(() => setError("This browser would not play the video. Scrub with the slider instead."));
    } else {
      video.pause();
    }
  };

  const capture = async (kind: FrameKind) => {
    const video = videoRef.current;
    if (!video) return;
    setBusy(kind);
    try {
      video.pause();
      await waitForSeek(video);
      await onCapture(kind, canvasFromVideo(video));
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not grab that frame.");
    } finally {
      setBusy(null);
    }
  };

  return (
    <div data-testid="video-picker">
      <div className="relative w-full overflow-hidden rounded-lg bg-black border border-border">
        {url && (
          <video
            ref={videoRef}
            src={url}
            muted
            playsInline
            preload="auto"
            className="w-full h-auto max-h-[70vh] block"
            onLoadedMetadata={(e) => {
              const video = e.currentTarget;
              setDuration(Number.isFinite(video.duration) ? video.duration : 0);
              // Nudge off zero so mobile browsers paint the first frame.
              video.currentTime = Math.min(0.05, video.duration || 0);
            }}
            onDurationChange={(e) => {
              const d = e.currentTarget.duration;
              if (Number.isFinite(d)) setDuration(d);
            }}
            onTimeUpdate={(e) => setTime(e.currentTarget.currentTime)}
            onPlay={() => setPlaying(true)}
            onPause={() => setPlaying(false)}
            onError={() =>
              setError(
                "This browser cannot play that video format. Try recording at normal speed, or use photos instead."
              )
            }
          />
        )}
      </div>

      {error && <p className="mt-2 text-sm text-red-700" role="alert">{error}</p>}

      <div className="mt-3">
        <input
          type="range"
          min={0}
          max={duration || 0}
          step={0.001}
          value={Math.min(time, duration || 0)}
          onChange={(e) => seek(Number(e.target.value))}
          disabled={!duration}
          aria-label="Position in the video"
          className="w-full accent-strava"
          data-testid="video-scrubber"
        />
        <div className="flex items-center justify-between text-xs text-mist tabular-nums">
          <span data-testid="video-time">{formatTime(time)} s</span>
          <span>{formatTime(duration)} s</span>
        </div>
      </div>

      <div className="mt-2 flex flex-wrap items-center gap-2">
        <Button variant="quiet" size="sm" onClick={() => seek(time - 0.25)} disabled={!duration} aria-label="Back a quarter second">
          −¼ s
        </Button>
        <Button variant="quiet" size="sm" onClick={() => seek(time - FRAME_STEP)} disabled={!duration} aria-label="Back one frame" data-testid="video-prev">
          ◀ frame
        </Button>
        <Button variant="primary" size="sm" onClick={togglePlay} disabled={!duration}>
          {playing ? "Pause" : "Play slow"}
        </Button>
        <Button variant="quiet" size="sm" onClick={() => seek(time + FRAME_STEP)} disabled={!duration} aria-label="Forward one frame" data-testid="video-next">
          frame ▶
        </Button>
        <Button variant="quiet" size="sm" onClick={() => seek(time + 0.25)} disabled={!duration} aria-label="Forward a quarter second">
          +¼ s
        </Button>
      </div>

      <div className="mt-4 grid gap-2 sm:grid-cols-3">
        {FRAME_ORDER.map((kind) => (
          <div key={kind} className="rounded-lg border border-border bg-surface p-3">
            <div className="flex items-center justify-between gap-2 mb-1">
              <div className="text-sm font-semibold text-text">{FRAMES[kind].clock}</div>
              {captured[kind] && <Badge tone="good">Got it</Badge>}
            </div>
            <p className="text-xs text-mist leading-snug mb-2">{FRAMES[kind].pick}</p>
            <Button
              variant={captured[kind] ? "ghost" : "accent"}
              size="sm"
              className="w-full"
              onClick={() => void capture(kind)}
              disabled={!duration || busy !== null}
              data-testid={`capture-${kind}`}
            >
              {busy === kind ? "Saving…" : captured[kind] ? "Replace with this frame" : "Use this frame"}
            </Button>
          </div>
        ))}
      </div>

      <div className="mt-3">
        <Button variant="ghost" size="sm" onClick={onClose}>
          Close video
        </Button>
      </div>
    </div>
  );
}
