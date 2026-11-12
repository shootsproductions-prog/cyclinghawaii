import { describe, expect, it } from "vitest";
import {
  angleAboveHorizontal,
  angleAt,
  clockDifference,
  crankClockAngle,
  distance,
  extensionChangeForKnee,
  legExtension,
  levelPoint,
  rotateAbout,
} from "../geometry";

describe("angleAt", () => {
  it("measures right, straight and acute angles", () => {
    expect(angleAt({ x: 1, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 1 })).toBeCloseTo(90, 10);
    expect(angleAt({ x: -5, y: 0 }, { x: 0, y: 0 }, { x: 7, y: 0 })).toBeCloseTo(180, 10);
    expect(angleAt({ x: 1, y: 0 }, { x: 0, y: 0 }, { x: 1, y: 1 })).toBeCloseTo(45, 10);
  });

  it("recovers a known angle from a 3-4-5 triangle", () => {
    // Right angle at the origin; the angle at (3,0) is atan(4/3).
    const expected = (Math.atan(4 / 3) * 180) / Math.PI;
    expect(angleAt({ x: 0, y: 0 }, { x: 3, y: 0 }, { x: 0, y: 4 })).toBeCloseTo(expected, 10);
  });

  it("does not depend on position, scale or mirror image", () => {
    const a = { x: 10, y: 4 };
    const v = { x: 2, y: 9 };
    const c = { x: -3, y: -6 };
    const base = angleAt(a, v, c);
    const moved = angleAt(
      { x: a.x * 3 + 100, y: a.y * 3 - 40 },
      { x: v.x * 3 + 100, y: v.y * 3 - 40 },
      { x: c.x * 3 + 100, y: c.y * 3 - 40 }
    );
    const mirrored = angleAt({ x: -a.x, y: a.y }, { x: -v.x, y: v.y }, { x: -c.x, y: c.y });
    expect(moved).toBeCloseTo(base, 10);
    expect(mirrored).toBeCloseTo(base, 10);
  });

  it("returns NaN when a ray has no length", () => {
    expect(angleAt({ x: 0, y: 0 }, { x: 0, y: 0 }, { x: 1, y: 1 })).toBeNaN();
  });

  it("stays finite for collinear points despite rounding", () => {
    expect(angleAt({ x: 0.1, y: 0.1 }, { x: 0.2, y: 0.2 }, { x: 0.3, y: 0.3 })).toBeCloseTo(180, 5);
  });
});

describe("angleAboveHorizontal", () => {
  it("reads the same whichever way the rider faces", () => {
    // Image y is down, so the shoulder has a SMALLER y than the hip.
    expect(angleAboveHorizontal({ x: 0, y: 100 }, { x: 100, y: 0 })).toBeCloseTo(45, 10);
    expect(angleAboveHorizontal({ x: 0, y: 100 }, { x: -100, y: 0 })).toBeCloseTo(45, 10);
  });
  it("is 0 for a flat back and 90 for an upright one", () => {
    expect(angleAboveHorizontal({ x: 0, y: 0 }, { x: 50, y: 0 })).toBeCloseTo(0, 10);
    expect(angleAboveHorizontal({ x: 0, y: 50 }, { x: 0, y: 0 })).toBeCloseTo(90, 10);
  });
});

describe("crankClockAngle", () => {
  const bb = { x: 100, y: 100 };
  it("maps the four clock positions for a rider facing right", () => {
    expect(crankClockAngle(bb, { x: 100, y: 50 }, 1)).toBeCloseTo(0, 10); // 12
    expect(crankClockAngle(bb, { x: 150, y: 100 }, 1)).toBeCloseTo(90, 10); // 3
    expect(crankClockAngle(bb, { x: 100, y: 150 }, 1)).toBeCloseTo(180, 10); // 6
    expect(crankClockAngle(bb, { x: 50, y: 100 }, 1)).toBeCloseTo(270, 10); // 9
  });
  it("mirrors for a rider facing left: forward is still 3 o'clock", () => {
    expect(crankClockAngle(bb, { x: 50, y: 100 }, -1)).toBeCloseTo(90, 10);
    expect(crankClockAngle(bb, { x: 150, y: 100 }, -1)).toBeCloseTo(270, 10);
  });
});

describe("clockDifference", () => {
  it("wraps around 12 o'clock", () => {
    expect(clockDifference(350, 0)).toBeCloseTo(-10, 10);
    expect(clockDifference(10, 350)).toBeCloseTo(20, 10);
    expect(clockDifference(170, 180)).toBeCloseTo(-10, 10);
  });
});

describe("levelPoint", () => {
  it("makes a line that rises to the right by the tilt horizontal again", () => {
    const tilt = 4;
    const t = (tilt * Math.PI) / 180;
    // A level feature as it appears in a tilted image: rises toward the right.
    const a = { x: 0, y: 200 };
    const b = { x: 300 * Math.cos(t), y: 200 - 300 * Math.sin(t) };
    const la = levelPoint(a, tilt);
    const lb = levelPoint(b, tilt);
    expect(lb.y).toBeCloseTo(la.y, 8);
    expect(distance(la, lb)).toBeCloseTo(300, 8);
  });
  it("is the identity at zero tilt", () => {
    expect(levelPoint({ x: 3, y: 4 }, 0)).toEqual({ x: 3, y: 4 });
  });
});

describe("legExtension", () => {
  it("is the sum of the segments for a straight leg", () => {
    expect(legExtension(430, 425, 0)).toBeCloseTo(855, 8);
  });
  it("is the hypotenuse at 90 degrees of flexion", () => {
    expect(legExtension(300, 400, 90)).toBeCloseTo(500, 8);
  });
  it("gives about 2 mm of saddle height per degree for an average leg", () => {
    const perDegree = extensionChangeForKnee(430, 425, 36, 35);
    expect(perDegree).toBeGreaterThan(1.7);
    expect(perDegree).toBeLessThan(2.4);
  });
  it("is positive when the knee needs to open (saddle goes up)", () => {
    expect(extensionChangeForKnee(430, 425, 47, 35)).toBeGreaterThan(0);
    expect(extensionChangeForKnee(430, 425, 22, 35)).toBeLessThan(0);
  });
});

describe("rotateAbout", () => {
  it("rotates counter-clockwise on screen for positive angles", () => {
    // Screen y is down: a point to the right of the origin moves UP (smaller y).
    const p = rotateAbout({ x: 10, y: 0 }, { x: 0, y: 0 }, 90);
    expect(p.x).toBeCloseTo(0, 8);
    expect(p.y).toBeCloseTo(-10, 8);
  });
});
