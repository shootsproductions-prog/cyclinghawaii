import { describe, expect, it } from "vitest";
import { FRAMES, FRAME_ORDER, frameLandmarks, missingRequired, nextToPlace } from "../landmarks";
import {
  EXPORT_APP,
  base64ToBuffer,
  bufferToBase64,
  buildExport,
  parseExport,
} from "../storage";
import type { FitSession } from "../types";

function session(id: string, withImage = true): FitSession {
  const image = new Uint8Array([255, 216, 255, 224, 0, 16, 74, 70, 73, 70, 1, 2, 3, 250]).buffer;
  return {
    id,
    createdAt: "2026-11-01T18:30:00.000Z",
    label: "Before",
    changeNote: "Nothing yet",
    settings: {
      style: "gravel",
      captureMode: "pedalling",
      crankLengthMm: 170,
      crankLengthConfirmed: true,
      tiltDeg: 1.5,
    },
    frames: {
      bottom: {
        kind: "bottom",
        width: 1600,
        height: 1200,
        landmarks: { hip: { x: 640, y: 420 }, knee: { x: 700, y: 760 }, ankle: { x: 690, y: 1080 } },
        autoPlaced: ["hip"],
        source: "video",
        ...(withImage ? { image, imageType: "image/jpeg" } : {}),
      },
    },
  };
}

describe("base64 helpers", () => {
  it("round-trip binary data, including a buffer larger than one chunk", () => {
    const bytes = new Uint8Array(100_000);
    for (let i = 0; i < bytes.length; i++) bytes[i] = (i * 31) % 256;
    const back = new Uint8Array(base64ToBuffer(bufferToBase64(bytes.buffer)));
    expect(back.length).toBe(bytes.length);
    expect(Array.from(back.subarray(0, 64))).toEqual(Array.from(bytes.subarray(0, 64)));
    expect(back[99_999]).toBe(bytes[99_999]);
  });
});

describe("export and import", () => {
  it("round-trips sessions with their pictures", () => {
    const file = buildExport([session("a"), session("b")], { includeImages: true });
    expect(file.app).toBe(EXPORT_APP);
    const back = parseExport(JSON.stringify(file));
    expect(back).toHaveLength(2);
    expect(back[0].id).toBe("a");
    expect(back[0].settings).toEqual(session("a").settings);
    expect(back[0].changeNote).toBe("Nothing yet");
    const frame = back[0].frames.bottom!;
    expect(frame.landmarks.knee).toEqual({ x: 700, y: 760 });
    expect(frame.autoPlaced).toEqual(["hip"]);
    expect(frame.source).toBe("video");
    expect(new Uint8Array(frame.image!)).toEqual(new Uint8Array(session("a").frames.bottom!.image!));
  });

  it("can leave the pictures out", () => {
    const file = buildExport([session("a")], { includeImages: false });
    expect(JSON.stringify(file)).not.toMatch(/imageBase64/);
    const [back] = parseExport(JSON.stringify(file));
    expect(back.frames.bottom!.image).toBeUndefined();
    expect(back.frames.bottom!.landmarks.hip).toEqual({ x: 640, y: 420 });
  });

  it("rejects files that are not ours with a readable message", () => {
    expect(() => parseExport("not json")).toThrow(/not valid JSON/);
    expect(() => parseExport('{"hello":"world"}')).toThrow(/not a Cycling Hawaii fit export/);
    expect(() => parseExport(JSON.stringify({ app: EXPORT_APP, version: 99, sessions: [] }))).toThrow(/newer version/);
  });

  it("drops malformed sessions and sanitises what it keeps", () => {
    const file = {
      app: EXPORT_APP,
      version: 1,
      sessions: [
        null,
        { id: "", createdAt: "2026-01-01T00:00:00Z", frames: {} },
        { id: "no-frames", createdAt: "2026-01-01T00:00:00Z", frames: {} },
        { id: "bad-date", createdAt: "yesterday", frames: { bottom: { width: 10, height: 10, landmarks: {} } } },
        {
          id: "ok",
          createdAt: "2026-01-01T00:00:00Z",
          label: "x".repeat(500),
          settings: { style: "downhill", captureMode: "static", crankLengthMm: 9999, tiltDeg: 80 },
          frames: {
            bottom: {
              width: 800,
              height: 600,
              source: "telepathy",
              landmarks: { hip: { x: 1, y: 2 }, tail: { x: 3, y: 4 }, knee: { x: "5", y: 6 } },
              autoPlaced: ["hip", "tail"],
              imageBase64: "!!! not base64 !!!",
            },
            sideways: { width: 1, height: 1, landmarks: {} },
          },
        },
      ],
    };
    const back = parseExport(JSON.stringify(file));
    expect(back).toHaveLength(1);
    const s = back[0];
    expect(s.id).toBe("ok");
    expect(s.label.length).toBe(120);
    expect(s.settings.style).toBe("endurance");
    expect(s.settings.captureMode).toBe("static");
    expect(s.settings.crankLengthMm).toBe(172.5);
    expect(s.settings.tiltDeg).toBe(15);
    expect(Object.keys(s.frames)).toEqual(["bottom"]);
    expect(s.frames.bottom!.landmarks).toEqual({ hip: { x: 1, y: 2 } });
    expect(s.frames.bottom!.autoPlaced).toEqual(["hip"]);
    expect(s.frames.bottom!.source).toBe("photo");
    expect(s.frames.bottom!.image).toBeUndefined();
  });
});

describe("landmark placement order", () => {
  it("asks for required points top to bottom, then the most useful optional ones", () => {
    const placed: Record<string, { x: number; y: number }> = {};
    const order: string[] = [];
    for (let i = 0; i < 20; i++) {
      const next = nextToPlace("bottom", placed);
      if (!next) break;
      order.push(next);
      placed[next] = { x: i, y: i };
    }
    expect(order).toEqual(["shoulder", "elbow", "wrist", "hip", "knee", "ankle", "pedal", "bb", "toe", "heel"]);
  });

  it("needs only knee, pedal axle and crank centre for the pedal-forward frame", () => {
    expect(FRAMES.forward.required).toEqual(["knee", "pedal", "bb"]);
    expect(missingRequired("forward", { knee: {}, pedal: {} })).toEqual(["bb"]);
    expect(missingRequired("forward", { knee: {}, pedal: {}, bb: {} })).toEqual([]);
  });

  it("lists every usable point for each frame exactly once", () => {
    for (const kind of FRAME_ORDER) {
      const ids = frameLandmarks(kind);
      expect(new Set(ids).size).toBe(ids.length);
      for (const id of FRAMES[kind].required) expect(ids).toContain(id);
    }
  });
});
