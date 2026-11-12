import { describe, expect, it } from "vitest";
import { analyzeSession, compareAnalyses, summarizeSession } from "../analyze";
import { assess, formatRange, formatValue } from "../assess";
import { clockLabel } from "../coaching";
import { DEFAULT_CRANK_LENGTH_MM, MEASUREMENT_ORDER, SOURCES, SPECS, rangeFor } from "../ranges";
import { buildFigure, defaultBody, type SyntheticPose } from "../synthetic";
import type { FitSession, FrameData, FrameKind, Landmarks, SessionSettings } from "../types";

const body = defaultBody(1);
const settings: SessionSettings = {
  style: "endurance",
  captureMode: "pedalling",
  crankLengthMm: DEFAULT_CRANK_LENGTH_MM,
  crankLengthConfirmed: true,
  tiltDeg: 0,
};

const good: Record<FrameKind, SyntheticPose> = {
  bottom: { torsoDeg: 45, shoulderDeg: 87, elbowFlexionDeg: 20, hipDeg: 100, kneeFlexionDeg: 35, ankleDeg: 120, crankClockDeg: 180 },
  forward: { torsoDeg: 45, shoulderDeg: 87, elbowFlexionDeg: 20, hipDeg: 72, kneeFlexionDeg: 80, ankleDeg: 105, crankClockDeg: 90 },
  top: { torsoDeg: 45, shoulderDeg: 87, elbowFlexionDeg: 20, hipDeg: 58, kneeFlexionDeg: 108, ankleDeg: 100, crankClockDeg: 0 },
};

function frame(kind: FrameKind, landmarks: Landmarks): FrameData {
  return { kind, width: 2000, height: 1500, landmarks, source: "sample" };
}

function session(
  poses: Partial<Record<FrameKind, SyntheticPose>>,
  overrides: Partial<SessionSettings> = {},
  edit?: (frames: Partial<Record<FrameKind, FrameData>>) => void
): Pick<FitSession, "frames" | "settings"> {
  const frames: Partial<Record<FrameKind, FrameData>> = {};
  for (const kind of Object.keys(poses) as FrameKind[]) {
    frames[kind] = frame(kind, buildFigure(poses[kind]!, { hip: { x: 800, y: 500 }, facing: 1, body }));
  }
  edit?.(frames);
  return { frames, settings: { ...settings, ...overrides } };
}

/** Put the knee a chosen distance (mm) ahead of the pedal axle in the forward frame. */
function setKops(frames: Partial<Record<FrameKind, FrameData>>, mm: number) {
  const l = frames.forward!.landmarks;
  l.knee = { x: l.pedal!.x + mm, y: l.knee!.y };
}

describe("assess", () => {
  it("marks a reading inside the band as in range", () => {
    const [f] = assess({ kneeBottom: { id: "kneeBottom", value: 36, unit: "deg", frame: "bottom" } }, settings);
    expect(f.status).toBe("in-range");
    expect(f.side).toBe("ok");
    expect(f.deviation).toBe(0);
  });

  it("treats a miss within the measurement tolerance as borderline, not actionable", () => {
    const [f] = assess({ kneeBottom: { id: "kneeBottom", value: 42, unit: "deg", frame: "bottom" } }, settings);
    expect(f.status).toBe("borderline");
    expect(f.side).toBe("high");
    expect(f.deviation).toBeCloseTo(2, 8);
  });

  it("marks a miss beyond the tolerance as out", () => {
    const [f] = assess({ kneeBottom: { id: "kneeBottom", value: 47, unit: "deg", frame: "bottom" } }, settings);
    expect(f.status).toBe("out");
    const [g] = assess({ kneeBottom: { id: "kneeBottom", value: 22, unit: "deg", frame: "bottom" } }, settings);
    expect(g.status).toBe("out");
    expect(g.side).toBe("low");
  });

  it("uses the posed-photo band when the frame was not taken while pedalling", () => {
    const value = { kneeBottom: { id: "kneeBottom" as const, value: 27, unit: "deg" as const, frame: "bottom" as const } };
    expect(assess(value, settings)[0].status).toBe("borderline");
    expect(assess(value, { ...settings, captureMode: "static" })[0].status).toBe("in-range");
  });

  it("judges torso angle against the chosen riding style", () => {
    const value = { torso: { id: "torso" as const, value: 37, unit: "deg" as const, frame: "bottom" as const } };
    expect(assess(value, { ...settings, style: "performance" })[0].status).toBe("in-range");
    expect(assess(value, { ...settings, style: "endurance" })[0].status).toBe("borderline");
    expect(assess(value, { ...settings, style: "gravel" })[0].side).toBe("low");
  });

  it("formats values and ranges for display", () => {
    expect(formatValue(35.4, "deg")).toBe("35°");
    expect(formatValue(12.2, "mm")).toBe("+12 mm");
    expect(formatValue(-8.6, "mm")).toBe("-9 mm");
    expect(formatRange({ min: 30, max: 40, aim: 35 }, "deg")).toBe("30 to 40°");
    expect(formatRange({ max: 115, aim: 108 }, "deg")).toBe("up to 115°");
  });
});

describe("range config", () => {
  it("has a spec, sane bounds and at least one source for every measurement", () => {
    for (const id of MEASUREMENT_ORDER) {
      const spec = SPECS[id];
      expect(spec, id).toBeDefined();
      expect(spec.sources.length, id).toBeGreaterThan(0);
      for (const sourceId of spec.sources) expect(SOURCES[sourceId], sourceId).toBeDefined();
      for (const style of ["endurance", "performance", "gravel"] as const) {
        for (const mode of ["pedalling", "static"] as const) {
          const r = rangeFor(id, style, mode);
          if (r.min !== undefined && r.max !== undefined) expect(r.min).toBeLessThan(r.max);
          if (r.min !== undefined) expect(r.aim).toBeGreaterThanOrEqual(r.min);
          if (r.max !== undefined) expect(r.aim).toBeLessThanOrEqual(r.max);
        }
      }
    }
    expect(Object.keys(SPECS).sort()).toEqual([...MEASUREMENT_ORDER].sort());
  });

  it("puts performance lower than endurance, and gravel no lower than endurance", () => {
    expect(SPECS.torso.ranges.performance.aim).toBeLessThan(SPECS.torso.ranges.endurance.aim);
    expect(SPECS.torso.ranges.gravel.aim).toBeGreaterThanOrEqual(SPECS.torso.ranges.endurance.aim);
  });
});

describe("coaching plan", () => {
  it("says nothing needs changing when every angle is in range", () => {
    const { plan, findings } = analyzeSession(session(good, {}, (f) => setKops(f, -20)));
    expect(findings.filter((f) => !f.informational).every((f) => f.status === "in-range")).toBe(true);
    expect(plan.primary).toBeNull();
    expect(plan.onDeck).toHaveLength(0);
    expect(plan.headline).toMatch(/Nothing to change/);
    expect(plan.goingWell.length).toBeGreaterThan(2);
  });

  it("raises the saddle when the knee is too bent at the bottom, sized from the rider's own leg", () => {
    const low = { ...good, bottom: { ...good.bottom, kneeFlexionDeg: 47 } };
    const { plan } = analyzeSession(session(low, {}, (f) => setKops(f, -20)));
    expect(plan.primary?.area).toBe("saddle-height");
    expect(plan.primary?.direction).toBe("up");
    // 47 -> 35 degrees on a 430/425 mm leg: hip-to-ankle goes from
    // 784.1 to 815.4 mm (law of cosines), so 31 mm. First step is capped.
    expect(plan.primary?.totalMm).toBe(31);
    expect(plan.primary?.stepMm).toBe(5);
    expect(plan.primary?.title).toBe("Raise your saddle 5 mm");
    expect(plan.headline).toBe("One change: raise your saddle 5 mm.");
    expect(plan.primary?.change).toMatch(/5 mm at a time/);
    expect(plan.primary?.feel.length).toBeGreaterThan(20);
    expect(plan.primary?.watch.length).toBeGreaterThan(20);
  });

  it("lowers the saddle when the leg is nearly straight", () => {
    const high = { ...good, bottom: { ...good.bottom, kneeFlexionDeg: 22, ankleDeg: 142 } };
    const { plan } = analyzeSession(session(high));
    expect(plan.primary?.area).toBe("saddle-height");
    expect(plan.primary?.direction).toBe("down");
    expect(plan.primary?.title).toMatch(/^Lower your saddle \d+ mm$/);
    expect(plan.primary?.observation).toMatch(/toe is also pointing down/);
  });

  it("never asks for more than 5 mm of saddle movement before a re-shoot", () => {
    for (const kneeFlexionDeg of [43.5, 47, 55, 62, 26.5, 20, 12]) {
      const { plan } = analyzeSession(session({ ...good, bottom: { ...good.bottom, kneeFlexionDeg } }));
      expect(plan.primary?.area).toBe("saddle-height");
      expect(plan.primary?.stepMm).toBeLessThanOrEqual(5);
      expect(plan.primary?.stepMm).toBeGreaterThanOrEqual(2);
      expect(plan.primary?.totalMm).toBeGreaterThanOrEqual(plan.primary!.stepMm!);
    }
  });

  it("does not act on a borderline knee angle on its own", () => {
    const edge = { ...good, bottom: { ...good.bottom, kneeFlexionDeg: 42 } };
    const { plan, findings } = analyzeSession(session(edge, {}, (f) => setKops(f, -20)));
    expect(findings.find((f) => f.id === "kneeBottom")?.status).toBe("borderline");
    expect(plan.primary).toBeNull();
    expect(plan.headline).toMatch(/edge of the range/);
  });

  it("acts on a borderline knee angle when the top of the stroke agrees", () => {
    const edge = {
      ...good,
      bottom: { ...good.bottom, kneeFlexionDeg: 42 },
      top: { ...good.top, kneeFlexionDeg: 121 },
    };
    const { plan } = analyzeSession(session(edge));
    expect(plan.primary?.area).toBe("saddle-height");
    expect(plan.primary?.direction).toBe("up");
    expect(plan.primary?.evidence).toContain("kneeTop");
  });

  it("puts saddle height first and keeps later problems on deck", () => {
    const messy = {
      ...good,
      bottom: { ...good.bottom, kneeFlexionDeg: 48, torsoDeg: 30, shoulderDeg: 104, elbowFlexionDeg: 5 },
    };
    const { plan } = analyzeSession(session(messy, {}, (f) => setKops(f, 45)));
    expect(plan.primary?.step).toBe(1);
    expect(plan.onDeck.map((r) => r.step)).toEqual([2, 3]);
    expect(plan.onDeck[0].direction).toBe("back");
    expect(plan.onDeck[1].title).toBe("Raise your handlebars 10 mm");
  });

  it("moves to fore-aft once saddle height is right", () => {
    const { plan } = analyzeSession(session(good, {}, (f) => setKops(f, 40)));
    expect(plan.primary?.area).toBe("saddle-fore-aft");
    expect(plan.primary?.direction).toBe("back");
    expect(plan.primary?.change).toMatch(/lower the saddle 1 to 2 mm/);

    const behind = analyzeSession(session(good, {}, (f) => setKops(f, -75))).plan;
    expect(behind.primary?.direction).toBe("forward");
  });

  it("leaves fore-aft alone inside the tolerance", () => {
    const { plan } = analyzeSession(session(good, {}, (f) => setKops(f, 10)));
    expect(plan.primary).toBeNull();
  });

  it("shortens reach for a rider stretched out with locked elbows", () => {
    const stretched = { ...good, bottom: { ...good.bottom, shoulderDeg: 103, elbowFlexionDeg: 4 } };
    const { plan } = analyzeSession(session(stretched, {}, (f) => setKops(f, -20)));
    expect(plan.primary?.area).toBe("cockpit");
    expect(plan.primary?.direction).toBe("shorter");
    expect(plan.primary?.title).toBe("Shorten your reach 10 mm");
  });

  it("gives a technique cue, not a part to buy, for locked elbows alone", () => {
    const locked = { ...good, bottom: { ...good.bottom, elbowFlexionDeg: 5 } };
    const { plan } = analyzeSession(session(locked, {}, (f) => setKops(f, -20)));
    expect(plan.primary?.title).toBe("Soften your elbows");
    expect(plan.primary?.stepMm).toBeUndefined();
  });

  it("lengthens reach for a cramped rider", () => {
    const cramped = { ...good, bottom: { ...good.bottom, shoulderDeg: 68 } };
    const { plan } = analyzeSession(session(cramped, {}, (f) => setKops(f, -20)));
    expect(plan.primary?.direction).toBe("longer");
  });

  it("only pushes an upright rider lower if they asked for a performance position", () => {
    const upright = { ...good, bottom: { ...good.bottom, torsoDeg: 58 } };
    expect(analyzeSession(session(upright, { style: "endurance" }, (f) => setKops(f, -20))).plan.primary).toBeNull();
    const perf = analyzeSession(session(upright, { style: "performance" }, (f) => setKops(f, -20))).plan;
    expect(perf.primary?.direction).toBe("lower");
  });

  it("warns before stem advice when fore-aft has not been checked", () => {
    const stretched = { bottom: { ...good.bottom, shoulderDeg: 103 } };
    const { plan } = analyzeSession(session(stretched));
    expect(plan.primary?.area).toBe("cockpit");
    expect(plan.notes.join(" ")).toMatch(/fore-aft has not been checked/);
  });

  it("insists on the bottom frame before anything else", () => {
    const { plan } = analyzeSession(session({ forward: good.forward }, {}, (f) => setKops(f, 60)));
    expect(plan.primary).toBeNull();
    expect(plan.onDeck).toHaveLength(1);
    expect(plan.headline).toMatch(/Start with the bottom-of-stroke frame/);
  });

  it("refuses to size a saddle change from a frame far from the bottom of the stroke", () => {
    const early = { ...good, bottom: { ...good.bottom, kneeFlexionDeg: 50, crankClockDeg: 150 } };
    const { plan } = analyzeSession(session(early));
    expect(plan.primary).toBeNull();
    expect(plan.onDeck[0]?.area).toBe("saddle-height");
    expect(plan.headline).toMatch(/Re-pick the bottom frame/);
    expect(plan.notes.join(" ")).toMatch(/5 o'clock/);
  });

  it("falls back to an average-leg estimate and says so when no crank is marked", () => {
    const low = { bottom: { ...good.bottom, kneeFlexionDeg: 47 } };
    const { plan } = analyzeSession(
      session(low, {}, (frames) => {
        delete frames.bottom!.landmarks.pedal;
        delete frames.bottom!.landmarks.bb;
      })
    );
    // Same 12 degrees on the stand-in 430/430 mm leg: 788.7 -> 820.2 mm.
    expect(plan.primary?.totalMm).toBe(32);
    expect(plan.primary?.change).toMatch(/average adult leg/);
  });

  it("flags an unconfirmed crank length", () => {
    const low = { bottom: { ...good.bottom, kneeFlexionDeg: 47 } };
    const { plan } = analyzeSession(session(low, { crankLengthConfirmed: false }));
    expect(plan.primary?.change).toMatch(/assumes 172.5 mm cranks/);
  });

  it("names the clock position of a crank angle", () => {
    expect(clockLabel(180)).toBe("6 o'clock");
    expect(clockLabel(92)).toBe("3 o'clock");
    expect(clockLabel(2)).toBe("12 o'clock");
    expect(clockLabel(355)).toBe("12 o'clock");
  });
});

describe("before and after", () => {
  it("credits a change that moved the knee toward its range", () => {
    const before = analyzeSession(session({ ...good, bottom: { ...good.bottom, kneeFlexionDeg: 48 } }));
    const after = analyzeSession(session({ ...good, bottom: { ...good.bottom, kneeFlexionDeg: 41 } }));
    const rows = compareAnalyses(before, after);
    const knee = rows.find((r) => r.id === "kneeBottom")!;
    expect(knee.before).toBeCloseTo(48, 6);
    expect(knee.after).toBeCloseTo(41, 6);
    expect(knee.delta).toBeCloseTo(-7, 6);
    expect(knee.verdict).toBe("better");
    expect(rows.find((r) => r.id === "torso")!.verdict).toBe("in-range");
  });

  it("calls out a change that made things worse, and one that did nothing", () => {
    const base = analyzeSession(session({ bottom: { ...good.bottom, kneeFlexionDeg: 46 } }));
    const worse = analyzeSession(session({ bottom: { ...good.bottom, kneeFlexionDeg: 52 } }));
    const same = analyzeSession(session({ bottom: { ...good.bottom, kneeFlexionDeg: 46.5 } }));
    expect(compareAnalyses(base, worse).find((r) => r.id === "kneeBottom")!.verdict).toBe("worse");
    expect(compareAnalyses(base, same).find((r) => r.id === "kneeBottom")!.verdict).toBe("same");
  });

  it("handles measurements present in only one session", () => {
    const before = analyzeSession(session({ bottom: good.bottom }));
    const after = analyzeSession(session(good));
    const rows = compareAnalyses(before, after);
    expect(rows.find((r) => r.id === "kneeTop")!.verdict).toBe("new");
    expect(compareAnalyses(after, before).find((r) => r.id === "kneeTop")!.verdict).toBe("gone");
  });
});

describe("summary for the coach page", () => {
  it("carries the open change and no image data", () => {
    const s = session({ ...good, bottom: { ...good.bottom, kneeFlexionDeg: 47 } });
    const summary = summarizeSession({
      ...s,
      id: "abc",
      createdAt: "2026-11-01T10:00:00.000Z",
      label: "Before",
    });
    expect(summary.openChange).toBe("Raise your saddle 5 mm");
    expect(summary.findings.some((f) => f.label === "Knee bend at the bottom" && f.value === 47)).toBe(true);
    expect(JSON.stringify(summary)).not.toMatch(/image/);
  });
});
