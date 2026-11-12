// The important test in this file: build a rider from KNOWN joint
// angles, hand the landmark positions to the measuring code, and check
// the same angles come back out. Done for both facing directions, a
// range of poses, a non-square scale and a tilted camera.

import { describe, expect, it } from "vitest";
import { measureFrames, facingOf, legSegmentsMm, scaleOf } from "../measure";
import {
  buildFigure,
  buildSampleFrame,
  defaultBody,
  figureKopsPx,
  SAMPLE_RIDER,
  type SyntheticPose,
} from "../synthetic";
import type { Landmarks } from "../types";

const PX_PER_MM = 0.9;
const body = defaultBody(PX_PER_MM);
const CRANK = 172.5;

const POSES: Record<string, SyntheticPose> = {
  bottomGood: { torsoDeg: 45, shoulderDeg: 88, elbowFlexionDeg: 20, hipDeg: 100, kneeFlexionDeg: 35, ankleDeg: 120, crankClockDeg: 180 },
  bottomLowSaddle: { torsoDeg: 44, shoulderDeg: 92, elbowFlexionDeg: 12, hipDeg: 93, kneeFlexionDeg: 48, ankleDeg: 108, crankClockDeg: 180 },
  bottomHighSaddle: { torsoDeg: 38, shoulderDeg: 97, elbowFlexionDeg: 28, hipDeg: 108, kneeFlexionDeg: 21, ankleDeg: 141, crankClockDeg: 176 },
  topTight: { torsoDeg: 36, shoulderDeg: 84, elbowFlexionDeg: 33, hipDeg: 43, kneeFlexionDeg: 119, ankleDeg: 97, crankClockDeg: 2 },
  upright: { torsoDeg: 61, shoulderDeg: 71, elbowFlexionDeg: 8, hipDeg: 112, kneeFlexionDeg: 31, ankleDeg: 126, crankClockDeg: 181 },
};

function measureBottom(landmarks: Landmarks, tiltDeg = 0) {
  return measureFrames({ bottom: { landmarks } }, { crankLengthMm: CRANK, tiltDeg });
}

describe("hand-built figures with angles you can check by eye", () => {
  it("straight leg is 0 degrees of flexion", () => {
    const { measurements } = measureBottom({
      hip: { x: 100, y: 100 },
      knee: { x: 100, y: 200 },
      ankle: { x: 100, y: 300 },
    });
    expect(measurements.kneeBottom!.value).toBeCloseTo(0, 8);
  });

  it("thigh level, shin vertical is 90 degrees of flexion", () => {
    const { measurements } = measureBottom({
      hip: { x: 100, y: 100 },
      knee: { x: 200, y: 100 },
      ankle: { x: 200, y: 200 },
    });
    expect(measurements.kneeBottom!.value).toBeCloseTo(90, 8);
  });

  it("thigh straight down, shin swung 30 degrees is 30 degrees of flexion", () => {
    const { measurements } = measureBottom({
      hip: { x: 0, y: 0 },
      knee: { x: 0, y: 100 },
      // 100 px along a line 30 degrees off vertical: (sin 30, cos 30) * 100
      ankle: { x: -50, y: 100 + 86.60254037844386 },
    });
    expect(measurements.kneeBottom!.value).toBeCloseTo(30, 8);
  });

  it("torso, shoulder, elbow and hip on a figure made of right angles", () => {
    // Facing right. Back at 45 degrees; upper arm square to the back;
    // forearm in line with the upper arm; thigh level.
    const { measurements } = measureBottom({
      hip: { x: 100, y: 200 },
      shoulder: { x: 200, y: 100 },
      elbow: { x: 300, y: 200 },
      wrist: { x: 400, y: 300 },
      knee: { x: 250, y: 200 },
      ankle: { x: 250, y: 350 },
      toe: { x: 400, y: 350 },
    });
    expect(measurements.torso!.value).toBeCloseTo(45, 8);
    expect(measurements.shoulder!.value).toBeCloseTo(90, 8);
    expect(measurements.elbow!.value).toBeCloseTo(0, 8);
    expect(measurements.hipBottom!.value).toBeCloseTo(45, 8);
    expect(measurements.kneeBottom!.value).toBeCloseTo(90, 8);
    expect(measurements.ankleBottom!.value).toBeCloseTo(90, 8);
  });
});

describe("measuring a synthetic rider with known angles", () => {
  for (const [name, pose] of Object.entries(POSES)) {
    for (const facing of [1, -1] as const) {
      it(`recovers every angle: ${name}, facing ${facing === 1 ? "right" : "left"}`, () => {
        const landmarks = buildFigure(pose, { hip: { x: 640, y: 420 }, facing, body });
        const { measurements, diagnostics } = measureBottom(landmarks);
        expect(measurements.kneeBottom!.value).toBeCloseTo(pose.kneeFlexionDeg, 6);
        expect(measurements.hipBottom!.value).toBeCloseTo(pose.hipDeg, 6);
        expect(measurements.torso!.value).toBeCloseTo(pose.torsoDeg, 6);
        expect(measurements.shoulder!.value).toBeCloseTo(pose.shoulderDeg, 6);
        expect(measurements.elbow!.value).toBeCloseTo(pose.elbowFlexionDeg, 6);
        expect(measurements.ankleBottom!.value).toBeCloseTo(pose.ankleDeg, 6);
        expect(diagnostics.bottom!.facing).toBe(facing);
        expect(diagnostics.bottom!.crankClockDeg).toBeCloseTo(pose.crankClockDeg, 6);
        expect(diagnostics.bottom!.pxPerMm).toBeCloseTo(PX_PER_MM, 6);
      });
    }
  }

  it("reports top-of-stroke knee and hip from the top frame", () => {
    const top = buildFigure(POSES.topTight, { hip: { x: 500, y: 300 }, facing: 1, body });
    const bottom = buildFigure(POSES.bottomGood, { hip: { x: 500, y: 300 }, facing: 1, body });
    const { measurements } = measureFrames(
      { top: { landmarks: top }, bottom: { landmarks: bottom } },
      { crankLengthMm: CRANK }
    );
    expect(measurements.kneeTop!.value).toBeCloseTo(119, 6);
    expect(measurements.hipTop!.value).toBeCloseTo(43, 6);
    expect(measurements.ankleRange!.value).toBeCloseTo(120 - 97, 6);
  });

  it("is unaffected by where the rider is in the frame or how big they are", () => {
    const small = buildFigure(POSES.bottomGood, { hip: { x: 90, y: 70 }, facing: 1, body: defaultBody(0.2) });
    const { measurements } = measureBottom(small);
    expect(measurements.kneeBottom!.value).toBeCloseTo(35, 6);
    expect(measurements.torso!.value).toBeCloseTo(45, 6);
  });
});

describe("camera tilt", () => {
  const pose = POSES.bottomGood;
  const tilt = 5;
  const tilted = buildFigure(pose, { hip: { x: 640, y: 420 }, facing: 1, body, tiltDeg: tilt });

  it("leaves joint angles alone but skews torso angle when uncorrected", () => {
    const { measurements } = measureBottom(tilted, 0);
    // Joint angles do not care about rotation.
    expect(measurements.kneeBottom!.value).toBeCloseTo(pose.kneeFlexionDeg, 6);
    expect(measurements.shoulder!.value).toBeCloseTo(pose.shoulderDeg, 6);
    // Angles against the horizon do: the error equals the tilt.
    expect(Math.abs(measurements.torso!.value - pose.torsoDeg)).toBeCloseTo(tilt, 6);
  });

  it("recovers torso angle and crank position once the tilt is entered", () => {
    const { measurements, diagnostics } = measureBottom(tilted, tilt);
    expect(measurements.torso!.value).toBeCloseTo(pose.torsoDeg, 6);
    expect(diagnostics.bottom!.crankClockDeg).toBeCloseTo(pose.crankClockDeg, 6);
  });
});

describe("knee over pedal axle", () => {
  const forwardPose: SyntheticPose = {
    torsoDeg: 45, shoulderDeg: 88, elbowFlexionDeg: 20, hipDeg: 70, kneeFlexionDeg: 82, ankleDeg: 104, crankClockDeg: 90,
  };

  for (const facing of [1, -1] as const) {
    it(`matches the figure's true offset in mm, facing ${facing === 1 ? "right" : "left"}`, () => {
      const options = { hip: { x: 600, y: 400 }, facing, body };
      const landmarks = buildFigure(forwardPose, options);
      const expectedMm = figureKopsPx(forwardPose, options) / PX_PER_MM;
      const { measurements } = measureFrames({ forward: { landmarks } }, { crankLengthMm: CRANK });
      expect(measurements.kops!.value).toBeCloseTo(expectedMm, 6);
      expect(measurements.kops!.unit).toBe("mm");
    });
  }

  it("needs only knee, pedal and crank centre, and finds facing from the crank", () => {
    const options = { hip: { x: 600, y: 400 }, facing: -1 as const, body };
    const full = buildFigure(forwardPose, options);
    const landmarks = { knee: full.knee, pedal: full.pedal, bb: full.bb };
    const { measurements, diagnostics } = measureFrames({ forward: { landmarks } }, { crankLengthMm: CRANK });
    expect(diagnostics.forward!.facing).toBe(-1);
    expect(measurements.kops!.value).toBeCloseTo(figureKopsPx(forwardPose, options) / PX_PER_MM, 6);
  });

  it("is positive when the knee is ahead of the axle and negative when behind", () => {
    const bb = { x: 300, y: 500 };
    const pedal = { x: 300 + CRANK, y: 500 }; // 1 px per mm, facing right
    const ahead = measureFrames(
      { forward: { landmarks: { bb, pedal, knee: { x: pedal.x + 25, y: 100 } } } },
      { crankLengthMm: CRANK }
    );
    const behind = measureFrames(
      { forward: { landmarks: { bb, pedal, knee: { x: pedal.x - 30, y: 100 } } } },
      { crankLengthMm: CRANK }
    );
    expect(ahead.measurements.kops!.value).toBeCloseTo(25, 6);
    expect(behind.measurements.kops!.value).toBeCloseTo(-30, 6);
  });

  it("is skewed by camera tilt and fixed by the tilt setting", () => {
    const options = { hip: { x: 600, y: 400 }, facing: 1 as const, body };
    const expectedMm = figureKopsPx(forwardPose, options) / PX_PER_MM;
    const tilted = buildFigure(forwardPose, { ...options, tiltDeg: 3 });
    const raw = measureFrames({ forward: { landmarks: tilted } }, { crankLengthMm: CRANK });
    const fixed = measureFrames({ forward: { landmarks: tilted } }, { crankLengthMm: CRANK, tiltDeg: 3 });
    // 3 degrees of tilt moves the knee more than 10 mm relative to the pedal.
    expect(Math.abs(raw.measurements.kops!.value - expectedMm)).toBeGreaterThan(10);
    expect(fixed.measurements.kops!.value).toBeCloseTo(expectedMm, 6);
  });
});

describe("missing points", () => {
  it("measures what it can and skips the rest without throwing", () => {
    const full = buildFigure(POSES.bottomGood, { hip: { x: 640, y: 420 }, facing: 1, body });
    const { measurements } = measureBottom({ hip: full.hip, knee: full.knee, ankle: full.ankle });
    expect(measurements.kneeBottom!.value).toBeCloseTo(35, 6);
    expect(measurements.torso).toBeUndefined();
    expect(measurements.elbow).toBeUndefined();
    expect(measurements.ankleBottom).toBeUndefined();
  });

  it("returns nothing for an empty session", () => {
    const { measurements } = measureFrames({}, { crankLengthMm: CRANK });
    expect(Object.keys(measurements)).toHaveLength(0);
  });

  it("gives no millimetre value without a marked crank", () => {
    const { measurements } = measureFrames(
      { forward: { landmarks: { knee: { x: 1, y: 1 }, pedal: { x: 2, y: 2 } } } },
      { crankLengthMm: CRANK }
    );
    expect(measurements.kops).toBeUndefined();
  });
});

describe("scale and leg lengths", () => {
  it("derives pixels per mm from the crank and leg segments in mm", () => {
    const landmarks = buildFigure(POSES.bottomGood, { hip: { x: 640, y: 420 }, facing: 1, body });
    expect(scaleOf(landmarks, CRANK)).toBeCloseTo(PX_PER_MM, 8);
    const legs = legSegmentsMm({ bottom: { landmarks } }, { crankLengthMm: CRANK });
    expect(legs!.thighMm).toBeCloseTo(430, 6);
    expect(legs!.shankMm).toBeCloseTo(425, 6);
  });

  it("scales leg lengths with the crank length the rider enters", () => {
    const landmarks = buildFigure(POSES.bottomGood, { hip: { x: 640, y: 420 }, facing: 1, body });
    const legs = legSegmentsMm({ bottom: { landmarks } }, { crankLengthMm: 165 });
    expect(legs!.thighMm).toBeCloseTo((430 * 165) / 172.5, 6);
  });
});

describe("facingOf", () => {
  it("returns null when there is nothing to go on", () => {
    expect(facingOf({ knee: { x: 1, y: 1 } })).toBeNull();
  });
});

describe("sample rider on a fixed bike", () => {
  const bb = { x: 700, y: 700 };
  const frames = {
    bottom: buildSampleFrame("bottom", { bb, facing: 1, body })!,
    forward: buildSampleFrame("forward", { bb, facing: 1, body })!,
    top: buildSampleFrame("top", { bb, facing: 1, body })!,
  };

  it("keeps the saddle and crank centre in the same place in every frame", () => {
    for (const kind of ["forward", "top"] as const) {
      expect(frames[kind].hip.x).toBeCloseTo(frames.bottom.hip.x, 8);
      expect(frames[kind].hip.y).toBeCloseTo(frames.bottom.hip.y, 8);
      expect(frames[kind].bb).toEqual(frames.bottom.bb);
    }
  });

  it("has the knee flexion its saddle height was solved for, and true crank positions", () => {
    const { measurements, diagnostics } = measureFrames(
      {
        bottom: { landmarks: frames.bottom },
        forward: { landmarks: frames.forward },
        top: { landmarks: frames.top },
      },
      { crankLengthMm: CRANK }
    );
    expect(measurements.kneeBottom!.value).toBeCloseTo(SAMPLE_RIDER.kneeFlexionAtBottomDeg, 4);
    expect(measurements.torso!.value).toBeCloseTo(SAMPLE_RIDER.torsoDeg, 6);
    expect(measurements.shoulder!.value).toBeCloseTo(SAMPLE_RIDER.shoulderDeg, 6);
    expect(measurements.elbow!.value).toBeCloseTo(SAMPLE_RIDER.elbowFlexionDeg, 6);
    expect(diagnostics.bottom!.crankClockDeg).toBeCloseTo(180, 6);
    expect(diagnostics.forward!.crankClockDeg).toBeCloseTo(90, 6);
    expect(diagnostics.top!.crankClockDeg! % 360).toBeCloseTo(0, 6);
    // Leg more bent at the top than the bottom, as on a real bike.
    expect(measurements.kneeTop!.value).toBeGreaterThan(measurements.kneeBottom!.value + 50);
    expect(measurements.kops).toBeDefined();
  });

  it("mirrors cleanly for a rider facing left", () => {
    const left = buildSampleFrame("bottom", { bb, facing: -1, body })!;
    const { measurements } = measureFrames({ bottom: { landmarks: left } }, { crankLengthMm: CRANK });
    expect(measurements.kneeBottom!.value).toBeCloseTo(SAMPLE_RIDER.kneeFlexionAtBottomDeg, 4);
  });
});
