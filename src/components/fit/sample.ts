// Draws the sample rider for the "try it without a photo" demo.
// A plain stick figure on a bike on rollers, built from the same
// synthetic rider the unit tests measure.

import { frameFromCanvas } from "@/lib/fit/image";
import { FRAME_ORDER } from "@/lib/fit/landmarks";
import { buildSampleFrame, defaultBody } from "@/lib/fit/synthetic";
import type { FrameData, FrameKind, Landmarks, Point } from "@/lib/fit/types";

const WIDTH = 1280;
const HEIGHT = 960;
const PX_PER_MM = 0.52;
const BB: Point = { x: 600, y: 722 };

function line(ctx: CanvasRenderingContext2D, a: Point, b: Point, width: number, color: string) {
  ctx.strokeStyle = color;
  ctx.lineWidth = width;
  ctx.lineCap = "round";
  ctx.beginPath();
  ctx.moveTo(a.x, a.y);
  ctx.lineTo(b.x, b.y);
  ctx.stroke();
}

function ring(ctx: CanvasRenderingContext2D, c: Point, r: number, width: number, color: string) {
  ctx.strokeStyle = color;
  ctx.lineWidth = width;
  ctx.beginPath();
  ctx.arc(c.x, c.y, r, 0, Math.PI * 2);
  ctx.stroke();
}

function disc(ctx: CanvasRenderingContext2D, c: Point, r: number, color: string) {
  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.arc(c.x, c.y, r, 0, Math.PI * 2);
  ctx.fill();
}

function drawScene(ctx: CanvasRenderingContext2D, l: Required<Landmarks>) {
  const s = PX_PER_MM;
  const wheelR = 340 * s;
  const rear: Point = { x: BB.x - 410 * s, y: BB.y - 65 * s };
  const front: Point = { x: BB.x + 590 * s, y: BB.y - 65 * s };
  const floorY = rear.y + wheelR + 46 * s;

  // Backdrop
  ctx.fillStyle = "#f5f5f5";
  ctx.fillRect(0, 0, WIDTH, HEIGHT);
  ctx.fillStyle = "#e9e9e9";
  ctx.fillRect(0, floorY, WIDTH, HEIGHT - floorY);
  line(ctx, { x: 0, y: floorY }, { x: WIDTH, y: floorY }, 2, "#cfcfcf");

  // Rollers: two drums under the rear wheel, one under the front.
  const drumR = 42 * s;
  const drumY = floorY - drumR;
  for (const x of [rear.x - 120 * s, rear.x + 120 * s, front.x]) {
    disc(ctx, { x, y: drumY }, drumR, "#b9b9b9");
    ring(ctx, { x, y: drumY }, drumR, 2, "#8f8f8f");
  }
  line(ctx, { x: rear.x - 170 * s, y: floorY - 6 }, { x: front.x + 50 * s, y: floorY - 6 }, 8, "#8f8f8f");

  // Bike
  const frameColor = "#9aa3ad";
  ring(ctx, rear, wheelR, 9, "#3b3b3b");
  ring(ctx, front, wheelR, 9, "#3b3b3b");
  ring(ctx, rear, wheelR - 16, 3, "#b9b9b9");
  ring(ctx, front, wheelR - 16, 3, "#b9b9b9");
  const seatTop: Point = { x: l.hip.x - 6, y: l.hip.y + 66 * s };
  const seatCluster: Point = {
    x: BB.x + (seatTop.x - BB.x) * 0.7,
    y: BB.y + (seatTop.y - BB.y) * 0.7,
  };
  const headTop: Point = { x: front.x - 130 * s, y: seatCluster.y - 10 * s };
  const headBottom: Point = { x: front.x - 96 * s, y: seatCluster.y + 120 * s };
  line(ctx, BB, seatTop, 11, frameColor); // seat tube and post
  line(ctx, seatCluster, headTop, 11, frameColor); // top tube
  line(ctx, BB, headBottom, 12, frameColor); // down tube
  line(ctx, headTop, headBottom, 12, frameColor); // head tube
  line(ctx, BB, rear, 8, frameColor); // chain stay
  line(ctx, seatCluster, rear, 7, frameColor); // seat stay
  line(ctx, headBottom, front, 9, frameColor); // fork
  // Saddle
  line(ctx, { x: seatTop.x - 95 * s, y: seatTop.y }, { x: seatTop.x + 150 * s, y: seatTop.y + 6 * s }, 13, "#2b2b2b");
  // Stem and bar to the hands
  const stemEnd: Point = { x: headTop.x + 95 * s, y: headTop.y - 35 * s };
  line(ctx, headTop, stemEnd, 9, "#2b2b2b");
  line(ctx, stemEnd, { x: l.wrist.x + 10 * s, y: l.wrist.y + 22 * s }, 9, "#2b2b2b");
  // Crank and pedal
  disc(ctx, BB, 26 * s, "#6b7280");
  line(ctx, l.bb, l.pedal, 10, "#2b2b2b");
  line(ctx, { x: l.pedal.x - 52 * s, y: l.pedal.y + 2 }, { x: l.pedal.x + 52 * s, y: l.pedal.y + 2 }, 8, "#2b2b2b");

  // Rider
  const skin = "#c98d63";
  const kit = "#1f2937";
  const limb = 46 * s;
  line(ctx, l.hip, l.shoulder, 150 * s, "#f97316"); // jersey
  line(ctx, l.hip, l.knee, 105 * s, kit); // shorts
  line(ctx, l.knee, l.ankle, limb * 1.25, skin);
  line(ctx, l.shoulder, l.elbow, limb * 1.2, "#f97316");
  line(ctx, l.elbow, l.wrist, limb, skin);
  // Shoe
  line(ctx, l.heel, l.toe, 38 * s, "#f5f5f5");
  line(ctx, l.ankle, { x: (l.heel.x + l.toe.x) / 2, y: (l.heel.y + l.toe.y) / 2 }, 44 * s, "#f5f5f5");
  // Head and helmet
  const dx = l.shoulder.x - l.hip.x;
  const dy = l.shoulder.y - l.hip.y;
  const len = Math.hypot(dx, dy);
  const head: Point = {
    x: l.shoulder.x + (dx / len) * 150 * s + 20 * s,
    y: l.shoulder.y + (dy / len) * 150 * s - 55 * s,
  };
  disc(ctx, head, 98 * s, skin);
  ctx.fillStyle = "#111827";
  ctx.beginPath();
  ctx.arc(head.x, head.y - 8 * s, 108 * s, Math.PI * 1.02, Math.PI * 1.98);
  ctx.fill();

  // Stickers on the joints, as the setup guide suggests.
  for (const id of ["shoulder", "elbow", "wrist", "hip", "knee", "ankle"] as const) {
    disc(ctx, l[id], 9, "#ffffff");
    disc(ctx, l[id], 5, "#16a34a");
  }
}

/** Three frames of the sample rider, landmarks already placed. */
export async function buildSampleFrames(): Promise<Record<FrameKind, FrameData>> {
  const body = defaultBody(PX_PER_MM);
  const out = {} as Record<FrameKind, FrameData>;
  for (const kind of FRAME_ORDER) {
    const landmarks = buildSampleFrame(kind, { bb: BB, facing: 1, body });
    if (!landmarks) throw new Error("Could not build the sample rider.");
    const canvas = document.createElement("canvas");
    canvas.width = WIDTH;
    canvas.height = HEIGHT;
    const ctx = canvas.getContext("2d");
    if (!ctx) throw new Error("Could not draw the sample rider.");
    drawScene(ctx, landmarks);
    const frame = await frameFromCanvas(canvas, kind, "sample");
    frame.landmarks = landmarks;
    out[kind] = frame;
  }
  return out;
}
