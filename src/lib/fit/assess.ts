// Compare measurements with the target ranges. Pure.

import { MEASUREMENT_ORDER, SPECS, rangeFor, toleranceFor } from "./ranges";
import type {
  CaptureMode,
  Finding,
  FindingStatus,
  Measurements,
  RidingStyle,
} from "./types";

export interface AssessOptions {
  style: RidingStyle;
  captureMode: CaptureMode;
}

/**
 * One finding per available measurement, in display order.
 *
 * Status:
 *   in-range     inside the band
 *   borderline   outside, but by no more than the measurement tolerance.
 *                Could be the camera rather than the rider, so we show
 *                it and do not act on it.
 *   out          outside by more than the tolerance
 */
export function assess(measurements: Measurements, options: AssessOptions): Finding[] {
  const findings: Finding[] = [];
  for (const id of MEASUREMENT_ORDER) {
    const measured = measurements[id];
    if (!measured) continue;
    const spec = SPECS[id];
    const range = rangeFor(id, options.style, options.captureMode);
    const tolerance = toleranceFor(id);

    let side: Finding["side"] = "ok";
    let deviation = 0;
    if (range.min !== undefined && measured.value < range.min) {
      side = "low";
      deviation = range.min - measured.value;
    } else if (range.max !== undefined && measured.value > range.max) {
      side = "high";
      deviation = measured.value - range.max;
    }

    let status: FindingStatus = "in-range";
    if (side !== "ok") status = deviation > tolerance ? "out" : "borderline";

    findings.push({
      id,
      label: spec.label,
      value: measured.value,
      unit: spec.unit,
      range,
      status,
      side,
      deviation,
      informational: spec.informational,
    });
  }
  return findings;
}

export function findingFor(findings: Finding[], id: Finding["id"]): Finding | undefined {
  return findings.find((f) => f.id === id);
}

/** "30 to 40°", "up to 115°", "-40 to 0 mm". */
export function formatRange(range: Finding["range"], unit: "deg" | "mm"): string {
  const u = unit === "deg" ? "°" : " mm";
  if (range.min !== undefined && range.max !== undefined) {
    return `${range.min} to ${range.max}${u}`;
  }
  if (range.max !== undefined) return `up to ${range.max}${u}`;
  if (range.min !== undefined) return `${range.min}${u} or more`;
  return "";
}

export function formatValue(value: number, unit: "deg" | "mm"): string {
  const rounded = Math.round(value);
  if (unit === "deg") return `${rounded}°`;
  return `${rounded > 0 ? "+" : ""}${rounded} mm`;
}
