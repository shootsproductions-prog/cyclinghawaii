// The coach's read, written by rules.
//
// This is the version that always works: no API key, no network, the
// same answer for the same rides. It follows the same teaching loop as
// the bike fit tool: say what you see, give ONE thing to work on, give
// a drill that practises it, and say when to look again.
//
// The thresholds are deliberately plain. They live at the top so they
// are easy to tune.

import type { FitSummary } from "@/lib/fit/analyze";
import type { CoachAnalysis, CoachRead, PlannedDay, SessionKind } from "./types";

// ── Tunable thresholds ──────────────────────────────────────────────
/** Form at or below this means the rider is carrying a lot of fatigue. */
const FORM_DEEP_FATIGUE = -25;
/** Fitness rising faster than this per week is more than most bodies absorb. */
const RAMP_TOO_FAST = 8;
/** A week this many times the recent average is a spike. */
const SPIKE_RATIO = 1.5;
/** Share of riding time above "easy" beyond which every ride is a medium-hard ride. */
const TOO_MUCH_MIDDLE_PCT = 40;
/** Share of hard riding below which there is no real intensity. */
const NO_INTENSITY_PCT = 4;
/** Cadence below this is a grind for most riders on the road. */
const LOW_CADENCE = 78;
/** Weekly increase the plan allows when everything is steady. */
const BUILD_FACTOR = 1.08;

const DAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
const DAY_NAMES = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];

type FocusId =
  | "start"
  | "recover"
  | "consistency"
  | "hold"
  | "easy-days"
  | "add-intensity"
  | "cadence"
  | "long-ride"
  | "build";

const hours = (h: number): string => {
  if (h < 1) return `${Math.round(h * 60)} minutes`;
  const rounded = Math.round(h * 2) / 2;
  return `${rounded % 1 === 0 ? rounded.toFixed(0) : rounded.toFixed(1)} hour${rounded === 1 ? "" : "s"}`;
};

const pct = (v: number): string => `${Math.round(v)}%`;

function pickFocus(a: CoachAnalysis): FocusId {
  const { last28, consistency, load, intensity, cadence, weeks } = a;
  if (a.rideCount < 3 || last28.rides === 0) return "start";

  if ((load.form <= FORM_DEEP_FATIGUE && load.fitness >= 15) || load.ramp > RAMP_TOO_FAST) return "recover";

  if (consistency.weeksRidden < consistency.weeksConsidered - 1 || consistency.ridesPerWeek < 2) {
    return "consistency";
  }

  // The last complete week against the three before it.
  const done = weeks.filter((w) => !w.current);
  const lastWeek = done[done.length - 1];
  const before = done.slice(-4, -1);
  const baseline = before.length ? before.reduce((s, w) => s + w.load, 0) / before.length : 0;
  if (lastWeek && baseline > 30 && lastWeek.load > baseline * SPIKE_RATIO) return "hold";

  // Only act on the intensity split when it rests on something solid:
  // power, or a maximum heart rate we have reason to believe.
  const intensityTrusted = intensity.signal === "power" || a.profile.maxHrTrusted;
  if (intensity.basis !== "none" && intensity.hours >= 4 && intensityTrusted) {
    if (intensity.moderatePct + intensity.hardPct > TOO_MUCH_MIDDLE_PCT && consistency.ridesPerWeek >= 3) {
      return "easy-days";
    }
    if (intensity.hardPct < NO_INTENSITY_PCT && intensity.moderatePct < 15 && last28.hours >= 12) {
      return "add-intensity";
    }
  }

  if (cadence.recent !== undefined && cadence.recent < LOW_CADENCE) return "cadence";

  const typical = last28.rides ? (last28.hours * 3600) / last28.rides : 0;
  if (last28.hours >= 10 && last28.longestSec < typical * 1.5) return "long-ride";

  return "build";
}

interface Plan {
  targetHours: number;
  rides: number;
  hard: SessionKind | null;
  hardTitle: string;
  hardDetail: string;
  longShare: number;
  skills: boolean;
}

function planFor(focus: FocusId, a: CoachAnalysis): Plan {
  const weekly = a.last28.hours / 4;
  const usual = Math.round(a.consistency.ridesPerWeek) || 3;
  const base: Plan = {
    targetHours: Math.max(2, weekly),
    rides: Math.min(5, Math.max(3, usual)),
    hard: "tempo",
    hardTitle: "Steady tempo",
    hardDetail: "Warm up 15 minutes, then 3 x 10 minutes at a pace you could just talk through, 5 minutes easy between. Spin home.",
    longShare: 0.4,
    skills: false,
  };
  switch (focus) {
    case "start":
      return { ...base, targetHours: Math.max(2, Math.min(weekly || 2, 3)), rides: 3, hard: null, hardTitle: "", hardDetail: "", longShare: 0.42 };
    case "recover":
      return { ...base, targetHours: Math.max(1.5, weekly * 0.6), rides: 3, hard: null, hardTitle: "", hardDetail: "", longShare: 0.4 };
    case "consistency":
      return { ...base, targetHours: Math.max(2.5, weekly), rides: 3, hard: null, hardTitle: "", hardDetail: "", longShare: 0.42 };
    case "hold":
      return { ...base, targetHours: Math.max(2, weekly * 0.95), hard: null, hardTitle: "", hardDetail: "" };
    case "easy-days":
      return {
        ...base,
        hard: "hard",
        hardTitle: "The one hard day",
        hardDetail: "Warm up 15 minutes, then 4 x 4 minutes hard enough that you cannot talk, 4 minutes very easy between. This is the only ride this week that should hurt.",
      };
    case "add-intensity":
      return {
        ...base,
        targetHours: weekly,
        hard: "hard",
        hardTitle: "Short hard efforts",
        hardDetail: "Warm up 15 minutes, then 4 x 4 minutes hard enough that you cannot talk, 4 minutes very easy between. Cool down 10 minutes.",
      };
    case "cadence":
      return { ...base, skills: true, hard: "skills", hardTitle: "Spin-ups", hardDetail: "In an easy gear: 8 x 1 minute spinning as fast as you can without bouncing on the saddle, 2 minutes normal between. On the rollers is ideal, because they punish a choppy stroke." };
    case "long-ride":
      return { ...base, targetHours: weekly * 1.05, longShare: 0.48 };
    case "build":
      return { ...base, targetHours: weekly * BUILD_FACTOR };
  }
}

function round5(minutes: number): number {
  return Math.max(20, Math.round(minutes / 5) * 5);
}

/** Lay the week's rides on the days this rider usually rides. */
export function buildWeek(focus: FocusId, a: CoachAnalysis): PlannedDay[] {
  const plan = planFor(focus, a);
  const preferred = [...a.consistency.usualDays];
  // Sensible fallbacks: weekend first, then spread through the week.
  for (const d of [5, 1, 3, 6, 2, 4, 0]) if (!preferred.includes(d)) preferred.push(d);

  // Long ride on a weekend day the rider already uses, otherwise Saturday.
  const longDay = preferred.slice(0, 4).find((d) => d === 5 || d === 6) ?? 5;
  const rideDays = new Set<number>([longDay]);
  // Hard day: mid-week, not the day before or after the long ride.
  let hardDay: number | null = null;
  if (plan.hard) {
    hardDay =
      preferred.find((d) => d !== longDay && Math.abs(d - longDay) > 1 && !(longDay === 6 && d === 0)) ?? 2;
    rideDays.add(hardDay);
  }
  for (const d of preferred) {
    if (rideDays.size >= plan.rides) break;
    rideDays.add(d);
  }

  const totalMin = plan.targetHours * 60;
  const longMin = round5(Math.min(totalMin * plan.longShare, 300));
  const hardMin = hardDay !== null ? round5(Math.min(Math.max(60, totalMin * 0.22), 90)) : 0;
  const others = [...rideDays].filter((d) => d !== longDay && d !== hardDay);
  const otherMin = others.length ? round5(Math.max(30, (totalMin - longMin - hardMin) / others.length)) : 0;

  const easyDetail =
    focus === "recover"
      ? "Truly easy: small gear, nose breathing, no chasing anyone. The point is blood flow, not fitness."
      : focus === "easy-days"
        ? "Easy enough to hold a full conversation the whole way. If you catch yourself pushing up a hill, back off. This is the hard part."
        : "Conversation pace. You should finish feeling like you could do it again.";

  return DAYS.map((day, index): PlannedDay => {
    if (index === longDay) {
      return {
        day,
        kind: "long",
        title: focus === "recover" ? "Easy longer spin" : "Long ride",
        detail:
          focus === "recover"
            ? "Shorter than usual and flat if you can. Eat and drink as normal."
            : "Steady and unhurried. Eat something every 45 minutes and drink before you are thirsty. The trades and the heat count as effort.",
        minutes: longMin,
      };
    }
    if (index === hardDay && plan.hard) {
      return { day, kind: plan.hard, title: plan.hardTitle, detail: plan.hardDetail, minutes: hardMin };
    }
    if (rideDays.has(index)) {
      return { day, kind: "easy", title: "Easy ride", detail: easyDetail, minutes: otherMin };
    }
    return { day, kind: "rest", title: "Rest", detail: "Off the bike, or a walk. Rest is when the work turns into fitness.", minutes: 0 };
  });
}

function goingWell(a: CoachAnalysis): string[] {
  const out: string[] = [];
  const { consistency, last28, prev28, load, cadence, intensity } = a;
  if (consistency.weeksRidden >= consistency.weeksConsidered - 1) {
    out.push(
      consistency.weeksRidden === consistency.weeksConsidered
        ? `You have ridden every one of the last ${consistency.weeksConsidered} weeks. That habit is worth more than any single big ride.`
        : `You rode in ${consistency.weeksRidden} of the last ${consistency.weeksConsidered} weeks. The habit is there.`
    );
  }
  if (prev28.hours > 0 && last28.hours >= prev28.hours * 1.05 && load.ramp <= RAMP_TOO_FAST) {
    out.push(
      `Volume is building sensibly: ${hours(last28.hours)} in the last four weeks, up from ${hours(prev28.hours)} in the four before.`
    );
  }
  if (last28.longestSec >= 2.5 * 3600) {
    out.push(`You have a real long ride in the bank: ${hours(last28.longestSec / 3600)} in the last four weeks.`);
  }
  if (
    intensity.basis !== "none" &&
    (intensity.signal === "power" || a.profile.maxHrTrusted) &&
    intensity.easyPct >= 70 &&
    intensity.hardPct >= NO_INTENSITY_PCT
  ) {
    out.push(`Your mix is healthy: ${pct(intensity.easyPct)} easy with some properly hard riding on top.`);
  }
  if (cadence.recent !== undefined && cadence.recent >= 85) {
    out.push(`You spin well: about ${Math.round(cadence.recent)} rpm on average.`);
  }
  if (!load.warmingUp && load.form > -10 && load.form < 10 && last28.rides >= 8) {
    out.push("Your recent load is balanced: neither overcooked nor coasting.");
  }
  if (last28.climbM >= 3000) {
    out.push(`You are not avoiding the hills: ${Math.round(last28.climbM * 3.28084).toLocaleString("en-US")} ft of climbing in four weeks.`);
  }
  if (out.length === 0 && last28.rides > 0) {
    out.push(`You got out ${last28.rides} time${last28.rides === 1 ? "" : "s"} in the last four weeks. That is the part nobody can do for you.`);
  }
  return out.slice(0, 3);
}

function focusText(focus: FocusId, a: CoachAnalysis): CoachRead["focus"] & { headline: string } {
  const { last28, consistency, load, intensity, cadence } = a;
  const weekly = last28.hours / 4;
  switch (focus) {
    case "start":
      return {
        headline: "Not enough riding yet to read much. Let us build the habit first.",
        title: "Three rides this week",
        observe: `I can see ${a.rideCount} ride${a.rideCount === 1 ? "" : "s"} in total and ${last28.rides} in the last four weeks. That is too few to say anything about fitness, and it is the first thing to change.`,
        cue: "Ride three times this week. Length does not matter. Showing up does.",
        drill: "Put the three rides in your calendar now, on the days below. Lay your kit out the night before. If a day falls apart, do 20 minutes on the rollers rather than nothing.",
        recheck: "Come back in two weeks. With six rides logged there will be something real to coach.",
      };
    case "recover":
      return {
        headline: "You have done the work. This week the job is to absorb it.",
        title: "Back off and absorb",
        observe:
          load.ramp > RAMP_TOO_FAST
            ? `Your fitness number has climbed ${load.ramp.toFixed(0)} points in a week, which is faster than most bodies can absorb, and your form is at ${load.form.toFixed(0)}.`
            : `Your form is at ${load.form.toFixed(0)}: fatigue (${load.fatigue.toFixed(0)}) is running well ahead of fitness (${load.fitness.toFixed(0)}). That is a body asking for a breather.`,
        cue: "Ride about 60% of your usual hours, all of it easy.",
        drill: "On every ride this week, hold a pace where you can breathe through your nose. If you cannot, you are going too hard.",
        recheck: "Look at your form number next week. You want it back above -10 before you go hard again. If your legs still feel flat after a week, take another easy one.",
      };
    case "consistency":
      return {
        headline: "The fitness is not the problem. The gaps are.",
        title: "Show up three times a week",
        observe: `You rode in ${consistency.weeksRidden} of the last ${consistency.weeksConsidered} weeks, about ${consistency.ridesPerWeek.toFixed(1)} rides a week, and your longest break in the last six weeks was ${consistency.longestGapDays} days. Fitness leaks away in gaps like that faster than big rides can put it back.`,
        cue: "Three rides every week, even short ones, before any ride gets longer or harder.",
        drill: "Pick three fixed days (suggested below) and protect them. A 40 minute ride that happens beats a 3 hour ride that does not.",
        recheck: "In three weeks, count the weeks with three rides. Three out of three and we move on to making them count.",
      };
    case "hold":
      return {
        headline: "Big week. Good. Now hold it before you add more.",
        title: "Hold steady",
        observe: `Last week was well above your recent average. A jump like that is where niggles and flat legs come from, not from the training itself.`,
        cue: "Repeat a normal week. Do not chase last week.",
        drill: "Keep every ride at conversation pace this week and stop the long one while you still feel good.",
        recheck: "Next week, check that your form has stopped falling. Then add about 10% and no more.",
      };
    case "easy-days":
      return {
        headline: "You are riding medium-hard nearly every time. That is the trap.",
        title: "Make your easy days easy",
        observe: `${Math.round(intensity.easyPct) === 0 ? "None" : `Only ${pct(intensity.easyPct)}`} of your riding in the last four weeks was truly easy; ${Math.round(intensity.easyPct) === 0 ? "all of it" : pct(intensity.moderatePct + intensity.hardPct)} was moderate or hard${intensity.basis === "by-ride" ? " (judged from each ride's average)" : ""}. Studies of well-trained endurance athletes find most of them do roughly 80% of their training easy, which is what lets the hard days be properly hard.`,
        cue: "Slow down on every ride except one.",
        drill: "Pick one hard day (below). On every other ride, keep your heart rate under about " +
          `${Math.round(a.profile.maxHr * 0.75)} bpm, even if it means using your smallest gear on the climbs.`,
        recheck: "In four weeks the easy share should be 70% or more, and your hard day should feel noticeably stronger.",
      };
    case "add-intensity":
      return {
        headline: "A solid, steady base. It is ready for some sharpness.",
        title: "Add one hard session",
        observe: `You are consistent at about ${hours(weekly)} a week, but almost none of it (${pct(intensity.hardPct)}) is hard. Steady riding builds the engine; short hard efforts are what raise its ceiling.`,
        cue: "One hard session a week. Everything else stays easy.",
        drill: "4 x 4 minutes at an effort where you cannot speak in sentences, with 4 minutes of very easy spinning between. A steady climb is perfect.",
        recheck: "After three weeks of it, the same 4 minute efforts should cover more road or show more watts at the same feel.",
      };
    case "cadence":
      return {
        headline: "You are a strong grinder. Let us teach the legs to spin.",
        title: "Raise your cadence",
        observe: `Your average cadence is about ${Math.round(cadence.recent ?? 0)} rpm. Most riders are smoother and fresher late in a ride at 85 to 95. A low cadence loads the knees and the muscles instead of the lungs.`,
        cue: "One gear easier than feels natural.",
        drill: "Spin-ups: 8 x 1 minute in an easy gear, spinning as fast as you can without bouncing, 2 minutes normal between. Rollers are the best place for it.",
        recheck: "In four weeks your average should be up by 3 to 5 rpm without thinking about it.",
      };
    case "long-ride":
      return {
        headline: "Good, regular riding. One of those rides should be longer.",
        title: "Stretch the long ride",
        observe: `You ride about ${hours(weekly)} a week, but your longest ride in four weeks was ${hours(last28.longestSec / 3600)}, about the same as a normal day. Endurance comes from one ride a week that is clearly longer than the rest.`,
        cue: "Make one ride a week your long ride, and add 15 to 20 minutes to it each week.",
        drill: "On the long ride, ride the first half easier than you want to, and eat every 45 minutes. Finishing strong is the skill.",
        recheck: "In four weeks your long ride should be about an hour longer than today, at the same easy effort.",
      };
    case "build":
      return {
        headline: "Steady, balanced, consistent. Keep going and add a little.",
        title: "Add a little each week",
        observe: `About ${hours(weekly)} a week across ${consistency.ridesPerWeek.toFixed(1)} rides, fitness at ${load.fitness.toFixed(0)} and form at ${load.form.toFixed(0)}. Nothing here needs fixing.`,
        cue: "Add about 10% to the week, mostly on the long ride.",
        drill: "Keep one steady tempo session and one long ride each week. Every fourth week, drop back by a third and let it soak in.",
        recheck: "In four weeks your fitness number should be a few points higher with form no lower than -15.",
      };
  }
}

function fitNote(fit: FitSummary | null | undefined, focus: FocusId): string | undefined {
  if (!fit) return undefined;
  const when = new Date(fit.createdAt).toLocaleDateString("en-US", { month: "short", day: "numeric" });
  if (fit.openChange) {
    const link =
      focus === "cadence" && /raise your saddle/i.test(fit.openChange)
        ? " A low saddle makes a fast, smooth spin harder, so this and your cadence work go together."
        : "";
    return `Your last bike fit check (${when}) left one change open: ${fit.openChange.charAt(0).toLowerCase()}${fit.openChange.slice(1)}. Make it before this week's long ride, then re-shoot.${link}`;
  }
  return `Your last bike fit check (${when}) found nothing to change. Re-shoot if you change saddle, shoes or bars, or if something starts to ache.`;
}

function caveats(a: CoachAnalysis): string[] {
  const out: string[] = [];
  if (a.load.warmingUp && a.rideCount > 0) {
    out.push(`There are only ${a.historyDays} days of rides here. The fitness number needs about six weeks of history before it settles, so it reads low for now.`);
  }
  if (a.load.method === "duration") {
    out.push("None of these rides has heart rate or power, so load is estimated from time alone. A heart rate strap would make every number on this page sharper.");
  } else if (a.load.method === "hr") {
    out.push(
      a.profile.maxHrSource === "entered"
        ? "Load is estimated from heart rate."
        : `Load is estimated from heart rate, using ${a.profile.maxHr} bpm as your maximum (${a.profile.maxHrSource === "observed" ? "the highest seen in your rides" : "a default"}). Enter your real maximum for better numbers.`
    );
  } else if (a.load.method === "mixed") {
    out.push("Load comes from a mix of power, heart rate and time, depending on what each ride recorded.");
  }
  if (a.intensity.signal === "hr" && !a.profile.maxHrTrusted) {
    out.push(
      a.profile.maxHrSource === "observed"
        ? `Your heart rate never goes far above your usual riding level in these rides, so ${a.profile.maxHr} bpm is probably not your true maximum. I have not judged how hard you ride for that reason. Enter your maximum heart rate to get that part of the read.`
        : "There is no maximum heart rate to go on, so I have not judged how hard you ride. Enter yours to get that part of the read."
    );
  }
  if (a.intensity.basis === "by-ride") {
    out.push("Intensity is judged from each ride's average, which hides hard efforts inside easy rides. Imported ride files give a true minute-by-minute split.");
  }
  return out;
}

export function rulesRead(a: CoachAnalysis, fit?: FitSummary | null): CoachRead {
  const focus = pickFocus(a);
  const { headline, ...focusBody } = focusText(focus, a);
  const note = fitNote(fit, focus);
  return {
    source: "rules",
    headline,
    goingWell: goingWell(a),
    focus: focusBody,
    week: buildWeek(focus, a),
    ...(note ? { fitNote: note } : {}),
    caveats: caveats(a),
  };
}

export { DAY_NAMES };
