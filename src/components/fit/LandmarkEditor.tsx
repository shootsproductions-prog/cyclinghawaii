"use client";

// One frame, with the rider's points on it. Points can be found
// automatically, placed by tapping, dragged, or nudged with the arrow
// keys. Every point is always correctable by hand.

import { useCallback, useEffect, useRef, useState } from "react";
import type { KeyboardEvent as ReactKeyboardEvent, PointerEvent as ReactPointerEvent } from "react";
import { Badge, Button } from "@/components/ToolUi";
import type { Analysis } from "@/lib/fit/analyze";
import { clockLabel } from "@/lib/fit/coaching";
import { canvasFromFrame } from "@/lib/fit/image";
import {
  FRAMES,
  LANDMARKS,
  frameLandmarks,
  missingRequired,
  nextToPlace,
} from "@/lib/fit/landmarks";
import {
  detectPose,
  landmarksForSide,
  type BodySide,
  type PoseDetection,
} from "@/lib/fit/pose";
import type { FrameData, LandmarkId, Landmarks, Point } from "@/lib/fit/types";
import FigureOverlay from "./FigureOverlay";
import { frameUrl } from "./frameUrl";

interface Props {
  frame: FrameData;
  analysis: Analysis;
  tiltDeg: number;
  onTiltChange: (tiltDeg: number) => void;
  onChange: (landmarks: Landmarks, autoPlaced: LandmarkId[]) => void;
  /** Run detection as soon as the frame appears (the model is already loaded). */
  autoDetect?: boolean;
  onPoseLoaded?: () => void;
}

type PoseStatus =
  | { state: "idle" }
  | { state: "working" }
  | { state: "found"; detection: PoseDetection; side: BodySide }
  | { state: "none" }
  | { state: "error"; message: string };

const NO_POINTS: LandmarkId[] = [];
const LOUPE = 128;
const LOUPE_ZOOM = 2.6;

export default function LandmarkEditor({
  frame,
  analysis,
  tiltDeg,
  onTiltChange,
  onChange,
  autoDetect,
  onPoseLoaded,
}: Props) {
  const boxRef = useRef<HTMLDivElement>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const handleRefs = useRef<Partial<Record<LandmarkId, HTMLButtonElement | null>>>({});
  const [displayWidth, setDisplayWidth] = useState(0);
  const [zoom, setZoom] = useState(1);
  const [selected, setSelected] = useState<LandmarkId | null>(null);
  const [placingDone, setPlacingDone] = useState(false);
  // `at` is the point's position in image pixels. `grab` is where on the point the
  // pointer took hold (pointer minus point), so a point does not jump when grabbed
  // off-centre. `nearCorner` says the pointer is under the magnifier's usual spot.
  const [drag, setDrag] = useState<{ id: LandmarkId; at: Point; grab: Point; nearCorner: boolean } | null>(null);
  const [pose, setPose] = useState<PoseStatus>({ state: "idle" });
  const [showTilt, setShowTilt] = useState(tiltDeg !== 0);

  const url = frameUrl(frame);
  const { landmarks } = frame;
  const autoPlaced = frame.autoPlaced ?? NO_POINTS;
  const def = FRAMES[frame.kind];
  const missing = missingRequired(frame.kind, landmarks);
  // What a tap on the picture places: the point the rider picked, or
  // the next one still missing. Null once everything is down or the
  // rider has said they are done with the optional points.
  const upNext = nextToPlace(frame.kind, landmarks);
  const placing: LandmarkId | null =
    selected ?? (upNext && (!placingDone || def.required.includes(upNext)) ? upNext : null);

  useEffect(() => {
    const el = boxRef.current;
    if (!el) return;
    const measure = () => setDisplayWidth(el.getBoundingClientRect().width);
    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  const scale = displayWidth > 0 ? displayWidth / frame.width : 0; // screen px per image px
  const unit = scale > 0 ? 1 / scale : frame.width / 640;

  const toImage = useCallback(
    (clientX: number, clientY: number): Point => {
      const rect = boxRef.current!.getBoundingClientRect();
      const x = ((clientX - rect.left) / rect.width) * frame.width;
      const y = ((clientY - rect.top) / rect.height) * frame.height;
      return {
        x: Math.min(frame.width, Math.max(0, x)),
        y: Math.min(frame.height, Math.max(0, y)),
      };
    },
    [frame.width, frame.height]
  );

  const setPoint = useCallback(
    (id: LandmarkId, p: Point) => {
      onChange(
        { ...landmarks, [id]: p },
        autoPlaced.filter((x) => x !== id)
      );
    },
    [landmarks, autoPlaced, onChange]
  );

  // ── Pointer handling ───────────────────────────────────────────
  // A tap on the picture places the "up next" point. Once nothing is
  // waiting, a press near a point drags it. Scrolling the page with a
  // finger on the picture still works (touch-action: pan-y); handles
  // opt out of that so a drag that starts on a point is a drag.

  /** True when the pointer is in the top-left of the visible picture, where the magnifier sits. */
  const nearCorner = (clientX: number, clientY: number): boolean => {
    const rect = scrollRef.current?.getBoundingClientRect();
    if (!rect) return false;
    return clientX - rect.left < LOUPE + 28 && clientY - rect.top < LOUPE + 28;
  };

  const changeZoom = (next: number) => {
    const el = scrollRef.current;
    if (!el || next === zoom) return;
    // Keep whatever is in the middle of the view in the middle.
    const cx = (el.scrollLeft + el.clientWidth / 2) / el.scrollWidth;
    const cy = (el.scrollTop + el.clientHeight / 2) / el.scrollHeight;
    setZoom(next);
    requestAnimationFrame(() => {
      el.scrollLeft = cx * el.scrollWidth - el.clientWidth / 2;
      el.scrollTop = cy * el.scrollHeight - el.clientHeight / 2;
    });
  };

  const clampToFrame = (p: Point): Point => ({
    x: Math.min(frame.width, Math.max(0, p.x)),
    y: Math.min(frame.height, Math.max(0, p.y)),
  });

  /** Start dragging `id`, which currently sits at `from`. */
  const beginDrag = (id: LandmarkId, from: Point, e: ReactPointerEvent<HTMLElement>) => {
    const pointer = toImage(e.clientX, e.clientY);
    setDrag({
      id,
      at: from,
      grab: { x: pointer.x - from.x, y: pointer.y - from.y },
      nearCorner: nearCorner(e.clientX, e.clientY),
    });
    try {
      boxRef.current?.setPointerCapture(e.pointerId);
    } catch {
      // Capture is a nicety; dragging still works without it.
    }
  };

  /** The placed point nearest the pointer, if one is within reach (in screen pixels). */
  const nearestPoint = (at: Point, reachPx: number): LandmarkId | null => {
    let best: LandmarkId | null = null;
    let bestDistance = reachPx / Math.max(scale, 1e-6);
    for (const id of frameLandmarks(frame.kind)) {
      const p = landmarks[id];
      if (!p) continue;
      const d = Math.hypot(p.x - at.x, p.y - at.y);
      if (d <= bestDistance) {
        best = id;
        bestDistance = d;
      }
    }
    return best;
  };

  // One handler for every press on the picture, so crowded points
  // (the foot, the crank) resolve to the NEAREST one rather than to
  // whichever handle happens to be on top.
  const onPointerDown = (e: ReactPointerEvent<HTMLDivElement>) => {
    if (e.button > 0) return;
    const at = toImage(e.clientX, e.clientY);
    const target = e.target as HTMLElement;
    const onHandle = !!target.closest?.("button[data-landmark]");
    const mouse = e.pointerType === "mouse";

    if (placing) {
      // A point is waiting to be placed. Pressing right on a point that
      // is already down still grabs that one, so a misplaced hip can be
      // fixed without finishing the rest first. When the rider picked
      // the point to place from the list, the press always places it,
      // which is the way to put two points very close together.
      // The reach is tight (about the size of the dot) so that points
      // which belong close together, like ankle and heel, can still be
      // placed one after the other.
      const existing = selected ? null : nearestPoint(at, mouse ? 9 : 10);
      if (!existing) {
        setPoint(placing, at);
        beginDrag(placing, at, e);
        return;
      }
      if (onHandle) e.preventDefault();
      handleRefs.current[existing]?.focus({ preventScroll: true });
      beginDrag(existing, landmarks[existing]!, e);
      return;
    }

    const id = nearestPoint(at, mouse ? 18 : 30);
    if (!id) return;
    if (onHandle) e.preventDefault();
    handleRefs.current[id]?.focus({ preventScroll: true });
    beginDrag(id, landmarks[id]!, e);
  };

  const onPointerMove = (e: ReactPointerEvent<HTMLDivElement>) => {
    if (!drag) return;
    const pointer = toImage(e.clientX, e.clientY);
    const at = clampToFrame({ x: pointer.x - drag.grab.x, y: pointer.y - drag.grab.y });
    setDrag({ ...drag, at, nearCorner: nearCorner(e.clientX, e.clientY) });
    setPoint(drag.id, at);
  };

  const endDrag = (e: ReactPointerEvent<HTMLDivElement>) => {
    if (!drag) return;
    try {
      boxRef.current?.releasePointerCapture(e.pointerId);
    } catch {
      // Already released.
    }
    if (selected === drag.id) setSelected(null);
    setDrag(null);
  };

  const onHandleKeyDown = (id: LandmarkId, e: ReactKeyboardEvent<HTMLButtonElement>) => {
    const p = landmarks[id];
    if (!p) return;
    const stepPx = (e.shiftKey ? 10 : 1) * Math.max(1, unit);
    const moves: Record<string, Point> = {
      ArrowLeft: { x: -stepPx, y: 0 },
      ArrowRight: { x: stepPx, y: 0 },
      ArrowUp: { x: 0, y: -stepPx },
      ArrowDown: { x: 0, y: stepPx },
    };
    const move = moves[e.key];
    if (move) {
      e.preventDefault();
      setPoint(id, {
        x: Math.min(frame.width, Math.max(0, p.x + move.x)),
        y: Math.min(frame.height, Math.max(0, p.y + move.y)),
      });
    } else if (e.key === "Delete" || e.key === "Backspace") {
      e.preventDefault();
      const rest = { ...landmarks };
      delete rest[id];
      onChange(rest, autoPlaced.filter((x) => x !== id));
    }
  };

  // ── Automatic detection ────────────────────────────────────────

  const applyDetection = useCallback(
    (detection: PoseDetection, side: BodySide) => {
      const picked =
        side === detection.side
          ? detection
          : landmarksForSide(detection.raw, side, frame.width, frame.height);
      // Keep bike points and anything the model was unsure about.
      const merged: Landmarks = { ...frame.landmarks, ...picked.landmarks };
      onChange(merged, Object.keys(picked.landmarks) as LandmarkId[]);
      setPose({ state: "found", detection, side });
    },
    [frame.landmarks, frame.width, frame.height, onChange]
  );

  const runDetection = useCallback(async () => {
    setPose({ state: "working" });
    try {
      const canvas = await canvasFromFrame(frame);
      if (!canvas) throw new Error("This frame has no picture to analyse.");
      const detection = await detectPose(canvas, frame.width, frame.height);
      onPoseLoaded?.();
      if (!detection || Object.keys(detection.landmarks).length < 4) {
        setPose({ state: "none" });
        return;
      }
      applyDetection(detection, detection.side);
    } catch (error) {
      setPose({
        state: "error",
        message: error instanceof Error ? error.message : "The pose model could not run.",
      });
    }
  }, [frame, applyDetection, onPoseLoaded]);

  // Auto-run once per frame image when the model is already loaded.
  const autoRanFor = useRef<ArrayBuffer | null>(null);
  useEffect(() => {
    if (!autoDetect || !frame.image || autoRanFor.current === frame.image) return;
    if (Object.keys(frame.landmarks).length > 0) return;
    autoRanFor.current = frame.image;
    void runDetection();
  }, [autoDetect, frame.image, frame.landmarks, runDetection]);

  const diagnostics = analysis.diagnostics[frame.kind];
  const crankError = diagnostics?.crankErrorDeg;
  const loupeAt = drag?.at ?? null;
  const loupeOnRight = drag?.nearCorner ?? false;

  return (
    <div data-testid={`editor-${frame.kind}`}>
      {/* What to do right now. */}
      <div className="mb-3 min-h-[3.25rem]" aria-live="polite">
        {placing ? (
          <p className="text-sm text-text leading-snug">
            <span className="font-semibold">
              Tap the {LANDMARKS[placing].label.toLowerCase()}
              {def.required.includes(placing) ? "" : " (optional)"}.
            </span>{" "}
            <span className="text-mist">{LANDMARKS[placing].where}</span>
          </p>
        ) : (
          <p className="text-sm text-mist leading-snug">
            All set for this frame. Drag any point to correct it, or pick a point below to place
            it again. Arrow keys nudge the selected point.
          </p>
        )}
      </div>

      <div className="mb-2 flex items-center justify-end gap-1.5 text-xs text-mist">
        {/* On a phone the foot and crank points sit a few pixels apart until you zoom. */}
        {zoom === 1 && scale > 0 && scale < 0.4 && (
          <span className="mr-auto text-amber-800">Zoom in to place points precisely.</span>
        )}
        <span>Zoom</span>
        {[1, 2, 3].map((z) => (
          <button
            key={z}
            type="button"
            onClick={() => changeZoom(z)}
            aria-pressed={zoom === z}
            data-testid={`zoom-${z}`}
            className={`min-w-[40px] px-2.5 py-1.5 rounded-full border font-semibold transition-colors ${
              zoom === z ? "bg-text text-bg border-text" : "bg-card text-text border-border hover:border-text/40"
            }`}
          >
            {z === 1 ? "Fit" : `${z}×`}
          </button>
        ))}
      </div>

      {/* -mx on small screens lets the picture use the card's full width. */}
      <div className="relative -mx-3 md:mx-0">
      <div
        ref={scrollRef}
        className="rounded-lg bg-surface border border-border"
        // Only a scroll box when zoomed in. At "Fit" it must not be one, or
        // it would swallow the swipe that scrolls the page.
        style={zoom > 1 ? { overflow: "auto", maxHeight: "78vh" } : { overflow: "hidden" }}
      >
      <div
        ref={boxRef}
        className="relative overflow-hidden select-none"
        style={{
          width: `${zoom * 100}%`,
          aspectRatio: `${frame.width} / ${frame.height}`,
          // Zoomed in, a finger on the picture pans it both ways. Handles opt out.
          touchAction: zoom > 1 ? "pan-x pan-y" : "pan-y",
          cursor: placing ? "crosshair" : "default",
        }}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={endDrag}
        onPointerCancel={endDrag}
        data-testid={`canvas-${frame.kind}`}
      >
        {url && (
          // eslint-disable-next-line @next/next/no-img-element -- local blob: URL; next/image cannot optimise it
          <img
            src={url}
            alt={`${def.title} frame`}
            draggable={false}
            className="absolute inset-0 w-full h-full object-fill pointer-events-none"
          />
        )}
        <svg
          viewBox={`0 0 ${frame.width} ${frame.height}`}
          className="absolute inset-0 w-full h-full pointer-events-none"
          aria-hidden="true"
        >
          <FigureOverlay
            kind={frame.kind}
            landmarks={landmarks}
            unit={unit}
            measurements={analysis.measurements}
            findings={analysis.findings}
            autoPlaced={autoPlaced}
            activeId={drag?.id ?? selected}
            showLevel={showTilt ? { tiltDeg, width: frame.width, height: frame.height } : null}
          />
        </svg>

        {/* Drag handles: real buttons, so they take focus and keys. */}
        {scale > 0 &&
          frameLandmarks(frame.kind).map((id) => {
            const p = landmarks[id];
            if (!p) return null;
            const isActive = drag?.id === id;
            // The handle is a focus target and a "do not scroll, this is
            // a drag" zone. Which point a press actually grabs is decided
            // by distance in onPointerDown. Finger-sized on touch screens,
            // tighter for a mouse.
            return (
              <button
                key={id}
                ref={(el) => {
                  handleRefs.current[id] = el;
                }}
                type="button"
                data-landmark={id}
                aria-label={`${LANDMARKS[id].label} point. Drag to move, arrow keys to nudge, Delete to remove.`}
                onKeyDown={(e) => onHandleKeyDown(id, e)}
                className="absolute w-7 h-7 [@media(pointer:coarse)]:w-11 [@media(pointer:coarse)]:h-11 rounded-full bg-transparent border-0 p-0 focus-visible:outline-2 focus-visible:outline-white focus-visible:outline-offset-0"
                style={{
                  left: p.x * scale,
                  top: p.y * scale,
                  transform: "translate(-50%, -50%)",
                  touchAction: "none",
                  cursor: isActive ? "grabbing" : "grab",
                  zIndex: isActive ? 3 : 2,
                }}
              />
            );
          })}

      </div>
      </div>

        {/* Magnifier, so a fingertip does not hide the point being placed.
            It sits outside the scrolling area so it stays put when zoomed. */}
        {loupeAt && url && scale > 0 && (
          <div
            className="absolute top-2 rounded-full border-2 border-white shadow-lg overflow-hidden pointer-events-none"
            style={{
              [loupeOnRight ? "right" : "left"]: 8,
              width: LOUPE,
              height: LOUPE,
              zIndex: 4,
              backgroundColor: "#111",
              backgroundImage: `url(${url})`,
              backgroundRepeat: "no-repeat",
              backgroundSize: `${frame.width * scale * LOUPE_ZOOM}px ${frame.height * scale * LOUPE_ZOOM}px`,
              backgroundPosition: `${LOUPE / 2 - loupeAt.x * scale * LOUPE_ZOOM}px ${LOUPE / 2 - loupeAt.y * scale * LOUPE_ZOOM}px`,
            }}
            aria-hidden="true"
          >
            <div className="absolute left-1/2 top-0 bottom-0 w-px bg-white/80" />
            <div className="absolute top-1/2 left-0 right-0 h-px bg-white/80" />
            <div className="absolute left-1/2 top-1/2 w-2.5 h-2.5 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-strava" />
          </div>
        )}
      </div>

      {/* Crank readout: tells the rider whether the frame is the right moment. */}
      {diagnostics?.crankClockDeg !== undefined && crankError !== undefined && (
        <p className="mt-2 text-xs text-mist" data-testid={`crank-${frame.kind}`}>
          Crank at about {clockLabel(diagnostics.crankClockDeg)}
          {Math.abs(crankError) <= 8
            ? `, right on ${def.clock}.`
            : Math.abs(crankError) <= 15
              ? `, ${Math.round(Math.abs(crankError))}° off ${def.clock}. Close enough.`
              : `, ${Math.round(Math.abs(crankError))}° off ${def.clock}. A frame nearer the mark will read truer.`}
        </p>
      )}

      {/* Point chips. */}
      <div className="mt-3 flex flex-wrap gap-1.5">
        {frameLandmarks(frame.kind).map((id) => {
          const placed = !!landmarks[id];
          const isTarget = placing === id;
          const optional = !def.required.includes(id);
          return (
            <button
              key={id}
              type="button"
              onClick={() => {
                setPlacingDone(false);
                setSelected(isTarget && selected === id ? null : id);
              }}
              aria-pressed={isTarget}
              className={`text-xs px-2.5 py-1.5 rounded-full border transition-colors ${
                isTarget
                  ? "bg-strava text-white border-strava"
                  : placed
                    ? "bg-card text-text border-border hover:border-text/40"
                    : "bg-surface text-mist border-dashed border-border hover:border-text/40"
              }`}
            >
              {placed ? "✓ " : ""}
              {LANDMARKS[id].label}
              {optional && !placed ? " (optional)" : ""}
            </button>
          );
        })}
      </div>

      <div className="mt-4 flex flex-wrap items-center gap-2">
        <Button
          variant="accent"
          size="sm"
          onClick={() => void runDetection()}
          disabled={pose.state === "working" || !frame.image}
          data-testid="detect-pose"
        >
          {pose.state === "working" ? "Looking for the rider…" : "Find the rider automatically"}
        </Button>
        {pose.state === "found" && (
          <Button
            variant="ghost"
            size="sm"
            onClick={() =>
              applyDetection(pose.detection, pose.side === "left" ? "right" : "left")
            }
          >
            Use the other leg
          </Button>
        )}
        {placing && !selected && !def.required.includes(placing) && (
          <Button variant="ghost" size="sm" onClick={() => setPlacingDone(true)}>
            Skip the optional points
          </Button>
        )}
        {Object.keys(landmarks).length > 0 && (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => {
              onChange({}, []);
              setSelected(null);
              setPlacingDone(false);
              setPose({ state: "idle" });
            }}
          >
            Clear points
          </Button>
        )}
        <Button variant="ghost" size="sm" onClick={() => setShowTilt((v) => !v)} aria-expanded={showTilt}>
          Camera tilt
        </Button>
      </div>

      <div className="mt-2 text-xs text-mist leading-relaxed" data-testid="pose-status" aria-live="polite">
        {pose.state === "idle" && (
          <>
            Runs on this device. The first use downloads the pose model (about 13 MB) from this
            site; your picture is not sent anywhere.
          </>
        )}
        {pose.state === "working" && <>Loading the model and reading the frame. This can take a little while the first time.</>}
        {pose.state === "found" && (
          <>
            Found the rider&apos;s {pose.side} side ({Math.round(pose.detection.confidence * 100)}%
            confidence). Hollow points are the model&apos;s guess: check each one against the
            sticker or the joint and drag it if it is off. The hip is the one it misses most.
            {pose.detection.skipped.length > 0 && " Some points were hidden; place those by hand."}
          </>
        )}
        {pose.state === "none" && (
          <>
            No rider found in this frame. That happens with loose clothing, poor light or a rider
            who is small in the picture. Place the points by tapping instead.
          </>
        )}
        {pose.state === "error" && (
          <>Automatic detection is not available here ({pose.message}) Place the points by tapping; everything else works the same.</>
        )}
      </div>

      {showTilt && (
        <div className="mt-3 rounded-lg border border-border bg-surface p-3">
          <label className="flex flex-wrap items-center gap-3 text-sm text-text">
            <span className="font-semibold">Level line</span>
            <input
              type="range"
              min={-8}
              max={8}
              step={0.5}
              value={tiltDeg}
              onChange={(e) => onTiltChange(Number(e.target.value))}
              className="flex-1 min-w-[140px] accent-strava"
              aria-label="Camera tilt in degrees"
            />
            <span className="tabular-nums w-14 text-right">{tiltDeg.toFixed(1)}°</span>
            {tiltDeg !== 0 && (
              <button type="button" className="text-xs text-strava font-semibold" onClick={() => onTiltChange(0)}>
                Reset
              </button>
            )}
          </label>
          <p className="mt-2 text-xs text-mist leading-relaxed">
            If the camera was not level, turn the blue dashed line until it runs along something
            you know is level, like the floor or the roller frame. Torso angle and the
            knee-over-pedal reading are corrected by this; joint angles do not need it.
          </p>
        </div>
      )}

      {missing.length > 0 && !placing && (
        <p className="mt-3 text-xs text-amber-800">
          Still needed for this frame: {missing.map((id) => LANDMARKS[id].label.toLowerCase()).join(", ")}.
        </p>
      )}
      {missing.length === 0 && (
        <div className="mt-3">
          <Badge tone="good">Frame ready</Badge>
        </div>
      )}
    </div>
  );
}
