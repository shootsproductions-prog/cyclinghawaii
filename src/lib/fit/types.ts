// Shared types for the bike fit tool (/fit).
//
// Everything in src/lib/fit is plain data + pure functions so it can be
// unit-tested without a browser. The only browser-bound modules are
// storage.ts (IndexedDB), pose.ts (MediaPipe) and image.ts (canvas).

/** A point in image pixel coordinates: origin top-left, y grows downward. */
export interface Point {
  x: number;
  y: number;
}

/** Body points a pose model can find, plus the bike points it cannot. */
export type LandmarkId =
  | "shoulder"
  | "elbow"
  | "wrist"
  | "hip"
  | "knee"
  | "ankle"
  | "heel"
  | "toe"
  | "pedal"
  | "bb";

export type Landmarks = Partial<Record<LandmarkId, Point>>;

/** The three moments of the pedal stroke the tool looks at. */
export type FrameKind = "bottom" | "forward" | "top";

export type RidingStyle = "endurance" | "performance" | "gravel";

/**
 * How the frame was captured. Angles measured while the rider is
 * actually pedalling run several degrees more flexed than a posed,
 * stationary measurement, so the knee targets differ.
 */
export type CaptureMode = "pedalling" | "static";

export interface FrameData {
  kind: FrameKind;
  /** Stored image size in pixels. Landmarks are in this coordinate space. */
  width: number;
  height: number;
  landmarks: Landmarks;
  /** Landmarks the pose model placed and the rider has not moved since. */
  autoPlaced?: LandmarkId[];
  source: "photo" | "video" | "sample";
  /** JPEG/PNG bytes. Kept on the device only; never sent anywhere. */
  image?: ArrayBuffer;
  imageType?: string;
}

export type MeasurementId =
  | "kneeBottom"
  | "kneeTop"
  | "hipTop"
  | "hipBottom"
  | "torso"
  | "shoulder"
  | "elbow"
  | "ankleBottom"
  | "ankleRange"
  | "kops";

export interface Measurement {
  id: MeasurementId;
  /** Degrees, or millimetres for kops. */
  value: number;
  unit: "deg" | "mm";
  frame: FrameKind;
}

export type Measurements = Partial<Record<MeasurementId, Measurement>>;

export interface FrameDiagnostics {
  /** Crank position as a clock angle: 0 = 12 o'clock, 90 = 3 o'clock (forward), 180 = 6 o'clock. */
  crankClockDeg?: number;
  /** Signed error from where this frame should be, in degrees of crank rotation. */
  crankErrorDeg?: number;
  /** Image pixels per millimetre, from the crank length. */
  pxPerMm?: number;
  /** +1 when the rider faces the right edge of the image, -1 when facing left. */
  facing: 1 | -1;
}

export interface MeasureResult {
  measurements: Measurements;
  diagnostics: Partial<Record<FrameKind, FrameDiagnostics>>;
}

export interface SessionSettings {
  style: RidingStyle;
  captureMode: CaptureMode;
  /** Crank arm length in mm; the scale reference for millimetre advice. */
  crankLengthMm: number;
  /** True once the rider has confirmed the crank length (it is stamped on the crank arm). */
  crankLengthConfirmed: boolean;
  /**
   * Camera tilt correction in degrees. Positive means a truly level
   * line appears to rise toward the right edge of the image.
   */
  tiltDeg: number;
}

export interface FitSession {
  id: string;
  createdAt: string;
  label: string;
  /** What the rider changed on the bike before this session, in their words. */
  changeNote?: string;
  settings: SessionSettings;
  frames: Partial<Record<FrameKind, FrameData>>;
}

export type FindingStatus = "in-range" | "borderline" | "out";

export interface Finding {
  id: MeasurementId;
  label: string;
  value: number;
  unit: "deg" | "mm";
  range: { min?: number; max?: number; aim: number };
  status: FindingStatus;
  /** Which side of the range the value sits on. */
  side: "low" | "high" | "ok";
  /** How far outside the range, in the measurement's unit (0 when inside). */
  deviation: number;
  /** Reference-only measurements are shown but never drive a recommendation. */
  informational: boolean;
}

export type AdjustmentArea = "saddle-height" | "saddle-fore-aft" | "cockpit";

export interface Recommendation {
  /** Position in the standard fitting order: 1 saddle height, 2 fore-aft, 3 reach and bar height. */
  step: 1 | 2 | 3;
  area: AdjustmentArea;
  title: string;
  observation: string;
  change: string;
  feel: string;
  watch: string;
  reshoot: string;
  /** Size of the first step in mm, when a scale is available. Sign follows `direction`. */
  stepMm?: number;
  /** Estimated total change to reach the aim point, in mm. */
  totalMm?: number;
  direction: "up" | "down" | "back" | "forward" | "shorter" | "longer" | "higher" | "lower";
  evidence: MeasurementId[];
}

export interface CoachingPlan {
  /** The one change to make now. Null when nothing needs changing or nothing can be judged yet. */
  primary: Recommendation | null;
  /** Later steps that look off today but must be re-measured after the primary change. */
  onDeck: Recommendation[];
  /** Short plain-language statements of what already looks good. */
  goingWell: string[];
  /** Things the rider should know about the reading itself (frame timing, missing points). */
  notes: string[];
  headline: string;
}
