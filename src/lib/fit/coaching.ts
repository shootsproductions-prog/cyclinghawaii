// Turn findings into coaching: one change at a time, in the standard
// fitting order, with what it should feel like and what to watch for.
//
// The order is fixed because each step moves the ones after it:
//   1. saddle height   (changes every joint angle)
//   2. saddle fore-aft (changes reach and hip angle)
//   3. reach and bar height
// So the plan has exactly one `primary` change. Anything further down
// the order that looks off today goes "on deck" and has to be
// re-measured after the primary change, not acted on now.
//
// Pure functions. All numbers come from ranges.ts.

import { findingFor, formatRange, formatValue } from "./assess";
import { extensionChangeForKnee } from "./geometry";
import { AVERAGE_LEG_MM, MAX_SADDLE_STEP_MM, STYLES } from "./ranges";
import type {
  CoachingPlan,
  Finding,
  FrameDiagnostics,
  FrameKind,
  Recommendation,
  SessionSettings,
} from "./types";

export interface CoachingInput {
  findings: Finding[];
  diagnostics: Partial<Record<FrameKind, FrameDiagnostics>>;
  /** Thigh and shank length in mm, when the bottom frame has a scale. */
  legSegments: { thighMm: number; shankMm: number } | null;
  settings: SessionSettings;
}

const RESHOOT =
  "Ride for ten minutes to settle in, then film the same side from the same spot and pick the same frames. Save it as a new session and compare the two.";

const deg = (f: Finding) => formatValue(f.value, "deg");

function isOff(f: Finding | undefined, side: "low" | "high"): boolean {
  return !!f && f.side === side && f.status !== "in-range";
}

function isOut(f: Finding | undefined, side?: "low" | "high"): boolean {
  return !!f && f.status === "out" && (side ? f.side === side : true);
}

/** "about 5 o'clock" from a crank clock angle. */
export function clockLabel(clockDeg: number): string {
  const hour = Math.round(clockDeg / 30) % 12 || 12;
  return `${hour} o'clock`;
}

// ───────────────────── 1. Saddle height ─────────────────────

function saddleHeight(input: CoachingInput): Recommendation | null {
  const { findings, legSegments, settings } = input;
  const knee = findingFor(findings, "kneeBottom");
  if (!knee || knee.side === "ok") return null;

  const kneeTop = findingFor(findings, "kneeTop");
  const ankle = findingFor(findings, "ankleBottom");

  // Knee too bent at the bottom means the saddle is low; too straight
  // means it is high. A borderline reading only counts when a second
  // sign agrees with it.
  const low = knee.side === "high";
  const secondSign = low ? isOff(kneeTop, "high") : isOut(ankle, "high");
  if (knee.status !== "out" && !secondSign) return null;

  const hasScale = !!legSegments;
  const leg = legSegments ?? AVERAGE_LEG_MM;
  const totalRaw = Math.abs(
    extensionChangeForKnee(leg.thighMm, leg.shankMm, knee.value, knee.range.aim)
  );
  const totalMm = Math.max(2, Math.round(totalRaw));
  const stepMm = totalMm <= MAX_SADDLE_STEP_MM + 1 ? totalMm : MAX_SADDLE_STEP_MM;

  const range = formatRange(knee.range, "deg");
  const modeText =
    settings.captureMode === "static" ? "a posed photo" : "a frame taken while pedalling";

  let scaleNote = "";
  if (!hasScale) {
    scaleNote =
      " That figure assumes an average adult leg. Mark the pedal axle and crank centre on the bottom frame for a number sized to you.";
  } else if (!settings.crankLengthConfirmed) {
    scaleNote = ` That figure assumes ${settings.crankLengthMm} mm cranks. Check the length stamped on the back of your crank arm and enter it for an exact number.`;
  }

  const inSteps =
    totalMm > stepMm
      ? ` The angles suggest about ${totalMm} mm in all. Get there ${stepMm} mm at a time and re-shoot between steps, because your ankle and hips change as the saddle moves.`
      : "";

  const mark =
    "Before you touch anything, mark the seatpost where it enters the frame with tape or a paint pen so you can always get back.";

  if (low) {
    return {
      step: 1,
      area: "saddle-height",
      direction: "up",
      stepMm,
      totalMm,
      title: `Raise your saddle ${stepMm} mm`,
      observation:
        `At the bottom of the stroke your knee is still bent ${deg(knee)}. For ${modeText} the range is ${range}. The leg never gets to open up, which usually means the saddle is low.` +
        (isOff(kneeTop, "high")
          ? ` Your knee also folds to ${deg(kneeTop!)} at the top, which fits the same picture.`
          : ""),
      change: `${mark} Loosen the seatpost clamp, raise the saddle ${stepMm} mm, and tighten to the torque printed on the clamp.${inSteps}${scaleNote}`,
      feel: "The stroke should feel longer and smoother over the bottom, with less pressure at the front of the knee. Your hips stay level and quiet on the saddle.",
      watch:
        "If your hips start rocking side to side, your toes point down to reach the pedal, or you feel a pull behind the knee, that is too high. Come back down 2 mm.",
      reshoot: RESHOOT,
      evidence: ["kneeBottom", ...(isOff(kneeTop, "high") ? (["kneeTop"] as const) : [])],
    };
  }

  return {
    step: 1,
    area: "saddle-height",
    direction: "down",
    stepMm,
    totalMm,
    title: `Lower your saddle ${stepMm} mm`,
    observation:
      `At the bottom of the stroke your knee is bent only ${deg(knee)}. For ${modeText} the range is ${range}. The leg is close to straight, which usually means the saddle is high.` +
      (isOut(ankle, "high")
        ? ` Your toe is also pointing down (${deg(ankle!)} at the ankle), a common sign of reaching for the pedal.`
        : ""),
    change: `${mark} Loosen the seatpost clamp, lower the saddle ${stepMm} mm, and tighten to the torque printed on the clamp.${inSteps}${scaleNote}`,
    feel: "You should feel planted on the saddle with quiet hips, and able to keep pressure on the pedal through the bottom of the stroke without stretching for it.",
    watch:
      "If the front of the knee starts to feel loaded, or the top of the stroke feels cramped, that is too low. Come back up 2 mm.",
    reshoot: RESHOOT,
    evidence: ["kneeBottom", ...(isOut(ankle, "high") ? (["ankleBottom"] as const) : [])],
  };
}

// ───────────────────── 2. Saddle fore-aft ─────────────────────

function saddleForeAft(input: CoachingInput): Recommendation | null {
  const kops = findingFor(input.findings, "kops");
  if (!kops || kops.status !== "out") return null;

  const back = kops.side === "high"; // knee too far forward: saddle goes back
  const stepMm = Math.min(MAX_SADDLE_STEP_MM, Math.max(3, Math.round(kops.deviation / 3)));
  const where =
    kops.value >= 0
      ? `${Math.round(kops.value)} mm ahead of`
      : `${Math.round(-kops.value)} mm behind`;
  const caveat =
    " This is a starting reference, not a rule, and it is the number a tilted camera upsets most. If the bike feels balanced, a small miss here is not a reason to move the saddle.";

  return {
    step: 2,
    area: "saddle-fore-aft",
    direction: back ? "back" : "forward",
    stepMm,
    title: `Slide your saddle ${back ? "back" : "forward"} ${stepMm} mm`,
    observation: `With the crank level and forward, the centre of your knee sits ${where} the pedal axle. Our reference is ${formatRange(kops.range, "mm")}, meaning the knee centre level with the axle or slightly behind it.${caveat}`,
    change: back
      ? `Mark the saddle rails at the clamp. Loosen the clamp, slide the saddle back ${stepMm} mm, keep it level, and re-tighten. Moving back also moves you further from the pedals, so lower the saddle 1 to 2 mm to keep the leg extension you have now.`
      : `Mark the saddle rails at the clamp. Loosen the clamp, slide the saddle forward ${stepMm} mm, keep it level, and re-tighten. Moving forward also brings you closer to the pedals, so raise the saddle 1 to 2 mm to keep the leg extension you have now.`,
    feel: back
      ? "More of your weight should rest on the saddle and less on your hands, and the push over the top of the stroke should feel like it starts from the hips."
      : "The knee should feel stacked over the pedal as you push down, and a fast spin should come more easily.",
    watch: back
      ? "If you now feel stretched to the bars or the backs of your thighs tighten, that is too far back."
      : "If more weight lands on your hands, or the front of the knee feels loaded, that is too far forward.",
    reshoot: RESHOOT,
    evidence: ["kops"],
  };
}

// ───────────────────── 3. Reach and bar height ─────────────────────

function cockpit(input: CoachingInput): Recommendation | null {
  const { findings, settings } = input;
  const torso = findingFor(findings, "torso");
  const shoulder = findingFor(findings, "shoulder");
  const elbow = findingFor(findings, "elbow");
  const hip = findingFor(findings, "hipTop");
  const style = STYLES[settings.style].label.toLowerCase();

  const tooLow = isOut(torso, "low") || isOut(hip, "low");
  const tooUpright = isOut(torso, "high");
  const reachLong = isOut(shoulder, "high");
  const reachShort = isOut(shoulder, "low");
  const locked = isOut(elbow, "low");

  const seen: string[] = [];
  if (torso) seen.push(`torso ${deg(torso)} (range ${formatRange(torso.range, "deg")})`);
  if (shoulder) seen.push(`shoulder ${deg(shoulder)} (${formatRange(shoulder.range, "deg")})`);
  if (elbow) seen.push(`elbow bend ${deg(elbow)} (${formatRange(elbow.range, "deg")})`);
  if (hip) seen.push(`hip at the top ${deg(hip)} (${formatRange(hip.range, "deg")})`);
  const numbers = seen.length ? ` Numbers for ${style}: ${seen.join(", ")}.` : "";

  const base = { step: 3 as const, area: "cockpit" as const, reshoot: RESHOOT };
  const evidence = (["torso", "shoulder", "elbow", "hipTop"] as const).filter((id) =>
    isOut(findingFor(findings, id))
  );

  if (tooLow) {
    return {
      ...base,
      direction: "higher",
      stepMm: 10,
      title: "Raise your handlebars 10 mm",
      observation:
        `Your upper body is lower than the ${style} range` +
        (reachLong ? " and your arms are reaching for the bars" : "") +
        (isOut(hip, "low") ? ", and the hip closes tightly at the top of the stroke" : "") +
        `.${numbers}`,
      change:
        "Move a 10 mm spacer from above the stem to below it. If there are no spacers left above, flip the stem so it angles up. Re-tighten the top cap first, then the stem bolts, to the torque printed on the stem.",
      feel: "Less weight on your hands, an easier breath, and a neck that can look up the road without craning.",
      watch: reachLong
        ? "If your arms still feel stretched once the bars are up, reach is the next thing: a stem 10 mm shorter. Re-shoot before you buy one."
        : "If you feel like you are sitting up into the wind with nothing to push against, come back down 5 mm.",
      evidence,
    };
  }

  if (reachLong) {
    return {
      ...base,
      direction: "shorter",
      stepMm: 10,
      title: "Shorten your reach 10 mm",
      observation: `Your arms are reaching forward for the bars${locked ? " and your elbows are close to locked" : ""}.${numbers}`,
      change:
        "First check the free fixes: are the hoods set high enough on the bar, and is the bar rotated so the hoods are level? If they are, fit a stem 10 mm shorter than the one you have (the length is printed on the stem).",
      feel: "Hands land on the hoods without a stretch, with a soft bend in the elbows and room to breathe.",
      watch:
        "If your knees start to come close to your elbows out of the saddle, or the steering feels twitchy, that is too short.",
      evidence,
    };
  }

  if (reachShort) {
    return {
      ...base,
      direction: "longer",
      stepMm: 10,
      title: "Lengthen your reach 10 mm",
      observation: `Your arms are tucked in close, which usually means the bars are near for your torso.${numbers}`,
      change:
        "Fit a stem 10 mm longer than the one you have (the length is printed on the stem). Keep the bar height where it is for now.",
      feel: "Room to stretch out, a flatter back without effort, and weight shared between saddle and hands.",
      watch:
        "If your shoulders creep up toward your ears or your elbows lock, that is too long.",
      evidence,
    };
  }

  if (locked) {
    return {
      ...base,
      direction: "shorter",
      title: "Soften your elbows",
      observation: `Your elbows are nearly locked straight, so every bump goes to your shoulders and neck.${numbers}`,
      change:
        "This one is technique before parts. On your next ride, drop your shoulders and let the elbows bend until you could tap the bar with your wrists loose. Hold it for five minutes at a time.",
      feel: "The bike moves under you over rough road while your shoulders stay still.",
      watch:
        "If you cannot hold a bent elbow without sliding back on the saddle, the reach is long for you: try a stem 10 mm shorter and re-shoot.",
      evidence,
    };
  }

  // More upright than the band only matters when the rider asked for
  // a performance position.
  if (tooUpright && settings.style === "performance") {
    return {
      ...base,
      direction: "lower",
      stepMm: 5,
      title: "Lower your handlebars 5 mm",
      observation: `You are sitting more upright than a performance position.${numbers}`,
      change:
        "Move a 5 mm spacer from below the stem to above it. Small steps: the lower back and hamstrings need weeks to adapt, not minutes.",
      feel: "A flatter back that you can hold while breathing normally, with the pelvis rolled forward rather than the spine bent.",
      watch:
        "If your hips rock, your lower back aches after an hour, or you cannot breathe deeply, go back up. Lower is only faster if you can hold it.",
      evidence,
    };
  }

  return null;
}

// ───────────────────── Plan ─────────────────────

function goingWell(findings: Finding[], settings: SessionSettings): string[] {
  const ok = (id: Finding["id"]) => {
    const f = findingFor(findings, id);
    return f && f.status === "in-range" ? f : null;
  };
  const out: string[] = [];
  const knee = ok("kneeBottom");
  if (knee) out.push(`Saddle height looks right: ${deg(knee)} of knee bend at the bottom (range ${formatRange(knee.range, "deg")}).`);
  const kneeTop = ok("kneeTop");
  if (kneeTop) out.push(`The knee is not over-folded at the top of the stroke (${deg(kneeTop)}).`);
  const kops = ok("kops");
  if (kops) out.push(`Saddle fore-aft is in a sensible place (knee ${formatValue(kops.value, "mm")} from the pedal axle).`);
  const torso = ok("torso");
  if (torso) out.push(`A torso angle of ${deg(torso)} suits ${STYLES[settings.style].label.toLowerCase()} riding.`);
  const shoulder = ok("shoulder");
  const elbow = ok("elbow");
  if (shoulder && elbow) out.push(`Arms are relaxed: shoulder ${deg(shoulder)}, elbows bent ${deg(elbow)}.`);
  else if (shoulder) out.push(`Reach to the bars looks comfortable (shoulder ${deg(shoulder)}).`);
  else if (elbow) out.push(`Elbows have a soft bend (${deg(elbow)}).`);
  const hip = ok("hipTop");
  if (hip) out.push(`The hip has room at the top of the stroke (${deg(hip)}).`);
  return out;
}

const FRAME_NAME: Record<FrameKind, string> = {
  bottom: "bottom-of-stroke",
  forward: "pedal-forward",
  top: "top-of-stroke",
};

/** Bottom-frame timing error beyond which the knee reading is not trusted. */
const BOTTOM_FRAME_LIMIT_DEG = 20;
const FRAME_NOTE_LIMIT_DEG = 15;

export function buildPlan(input: CoachingInput): CoachingPlan {
  const { findings, diagnostics, settings } = input;
  const notes: string[] = [];

  for (const kind of ["bottom", "forward", "top"] as FrameKind[]) {
    const d = diagnostics[kind];
    if (d?.crankClockDeg === undefined || d.crankErrorDeg === undefined) continue;
    if (Math.abs(d.crankErrorDeg) > FRAME_NOTE_LIMIT_DEG) {
      notes.push(
        `Your ${FRAME_NAME[kind]} frame shows the crank at about ${clockLabel(d.crankClockDeg)}, ${Math.round(Math.abs(d.crankErrorDeg))}° away from where it should be. Pick a frame closer to the mark for a truer reading.`
      );
    }
  }

  const height = saddleHeight(input);
  const foreAft = saddleForeAft(input);
  const reach = cockpit(input);
  const candidates = [height, foreAft, reach].filter((r): r is Recommendation => r !== null);

  const hasKnee = !!findingFor(findings, "kneeBottom");
  const hasKops = !!findingFor(findings, "kops");
  const bottomError = Math.abs(diagnostics.bottom?.crankErrorDeg ?? 0);

  let primary: Recommendation | null = null;
  let onDeck: Recommendation[] = [];
  let headline: string;

  if (!hasKnee) {
    // Saddle height comes first. Without it nothing downstream is safe to act on.
    onDeck = candidates;
    headline = "Start with the bottom-of-stroke frame. Saddle height comes before everything else.";
  } else if (height && bottomError > BOTTOM_FRAME_LIMIT_DEG) {
    onDeck = candidates;
    headline =
      "Re-pick the bottom frame before changing anything. The crank is too far from 6 o'clock to trust the knee angle.";
  } else {
    primary = candidates[0] ?? null;
    onDeck = candidates.slice(1);
    if (primary) {
      headline = `One change: ${primary.title.charAt(0).toLowerCase()}${primary.title.slice(1)}.`;
      if (primary.area === "cockpit" && !hasKops) {
        notes.push(
          "Saddle fore-aft has not been checked yet. It changes your reach, so add the pedal-forward frame before spending money on a stem."
        );
      }
    } else {
      const judged = findings.filter((f) => !f.informational);
      const borderline = judged.filter((f) => f.status === "borderline");
      headline =
        borderline.length > 0
          ? `Nothing to change. ${borderline.length === 1 ? "One number is" : "A few numbers are"} at the edge of the range, within what a camera can tell apart.`
          : `Nothing to change. Your position sits inside the ranges for ${STYLES[settings.style].label.toLowerCase()} riding.`;
    }
  }

  return {
    primary,
    onDeck,
    goingWell: goingWell(findings, settings),
    notes,
    headline,
  };
}
