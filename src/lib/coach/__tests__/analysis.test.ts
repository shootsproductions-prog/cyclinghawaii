import { describe, expect, it } from "vitest";
import { analyzeRides } from "../analysis";
import {
  DURATION_ONLY_LOAD_PER_HOUR,
  dayKey,
  dayNumber,
  loadSeries,
  resolveProfile,
  rideLoad,
  weekStartOf,
  weekdayOf,
} from "../load";
import { buildWeek, rulesRead } from "../rules";
import { sampleRides } from "../sample";
import type { CoachRide, RiderProfile } from "../types";

const TODAY = "2026-11-12"; // a Thursday

function ride(day: string, overrides: Partial<CoachRide> = {}): CoachRide {
  return {
    id: `r-${day}-${Math.random().toString(36).slice(2, 7)}`,
    source: "file",
    name: "Ride",
    start: `${day}T07:00:00`,
    kind: "road",
    movingSec: 3600,
    elapsedSec: 3900,
    distanceM: 25_000,
    climbM: 300,
    ...overrides,
  };
}

/** `count` days back from TODAY as a key. */
const ago = (days: number) => dayKey(dayNumber(TODAY) - days);

/** One ride on each listed weekday (0 = Monday) for each of the last `weeks` complete weeks plus this one. */
function steadyWeeks(weeks: number, weekdays: number[], overrides: Partial<CoachRide> = {}): CoachRide[] {
  const out: CoachRide[] = [];
  const thisWeek = weekStartOf(dayNumber(TODAY));
  for (let w = weeks; w >= 0; w--) {
    for (const wd of weekdays) {
      const day = thisWeek - w * 7 + wd;
      if (day <= dayNumber(TODAY)) out.push(ride(dayKey(day), overrides));
    }
  }
  return out;
}

describe("day arithmetic", () => {
  it("round-trips day keys and knows the weekday", () => {
    expect(dayKey(dayNumber("2026-11-12"))).toBe("2026-11-12");
    expect(weekdayOf(dayNumber("2026-11-12"))).toBe(3); // Thursday
    expect(weekdayOf(dayNumber("2026-11-09"))).toBe(0); // Monday
    expect(dayKey(weekStartOf(dayNumber("2026-11-15")))).toBe("2026-11-09"); // Sunday belongs to the week before
    expect(dayNumber("2026-03-01") - dayNumber("2026-02-28")).toBe(1);
    expect(dayNumber("2026-11-12T07:00:00")).toBe(dayNumber("2026-11-12"));
  });
});

describe("ride load", () => {
  const profile = resolveProfile({ maxHr: 190, restHr: 60, ftp: 250 }, []);

  it("scores an hour at threshold power as 100", () => {
    expect(rideLoad(ride(TODAY, { normPower: 250, avgPower: 240, powerMeasured: true }), profile)).toEqual({
      load: 100,
      method: "power",
    });
  });

  it("scales with the square of intensity and linearly with time", () => {
    const easy = rideLoad(ride(TODAY, { normPower: 175, movingSec: 7200, powerMeasured: true }), profile);
    expect(easy.load).toBeCloseTo(2 * 0.7 * 0.7 * 100, 6);
  });

  it("scores an hour at threshold heart rate as 100", () => {
    const noFtp = resolveProfile({ maxHr: 190, restHr: 60 }, []);
    // Threshold is taken as 85% of heart rate reserve: 60 + 0.85 x 130 = 170.5
    const r = rideLoad(ride(TODAY, { avgHr: 170.5 }), noFtp);
    expect(r.method).toBe("hr");
    expect(r.load).toBeCloseTo(100, 6);
  });

  it("weights hard minutes more than easy ones", () => {
    const noFtp = resolveProfile({ maxHr: 190, restHr: 60 }, []);
    const easy = rideLoad(ride(TODAY, { avgHr: 125 }), noFtp).load;
    const hard = rideLoad(ride(TODAY, { avgHr: 165 }), noFtp).load;
    expect(easy).toBeGreaterThan(20);
    expect(easy).toBeLessThan(45);
    expect(hard).toBeGreaterThan(easy * 2);
  });

  it("uses second-by-second heart rate when a file has it, and matches the average for a steady ride", () => {
    const noFtp = resolveProfile({ maxHr: 190, restHr: 60 }, []);
    const hist: number[] = new Array(141).fill(0);
    hist[140] = 3600;
    const fromHist = rideLoad(ride(TODAY, { avgHr: 140, hrHist: hist }), noFtp);
    const fromAvg = rideLoad(ride(TODAY, { avgHr: 140 }), noFtp);
    expect(fromHist.load).toBeCloseTo(fromAvg.load, 6);
    // Same average, but half the time easy and half hard, costs more.
    const split: number[] = new Array(171).fill(0);
    split[110] = 1800;
    split[170] = 1800;
    expect(rideLoad(ride(TODAY, { avgHr: 140, hrHist: split }), noFtp).load).toBeGreaterThan(fromAvg.load * 1.2);
  });

  it("ignores estimated power and falls back to heart rate, then to time alone", () => {
    const estimated = rideLoad(ride(TODAY, { avgPower: 250, powerMeasured: false, avgHr: 150 }), profile);
    expect(estimated.method).toBe("hr");
    const bare = rideLoad(ride(TODAY, { movingSec: 5400 }), profile);
    expect(bare).toEqual({ load: 1.5 * DURATION_ONLY_LOAD_PER_HOUR, method: "duration" });
  });

  it("needs an FTP before it will use power", () => {
    const noFtp = resolveProfile({ maxHr: 190 }, []);
    expect(rideLoad(ride(TODAY, { normPower: 250, powerMeasured: true }), noFtp).method).toBe("duration");
  });
});

describe("rider profile", () => {
  it("prefers an entered max heart rate, then the highest seen, then a default", () => {
    const rides = [ride(TODAY, { maxHr: 176 }), ride(ago(3), { maxHr: 181 })];
    expect(resolveProfile({ maxHr: 188 }, rides)).toMatchObject({ maxHr: 188, maxHrSource: "entered" });
    expect(resolveProfile({}, rides)).toMatchObject({ maxHr: 181, maxHrSource: "observed", restHr: 60 });
    expect(resolveProfile({}, [])).toMatchObject({ maxHr: 190, maxHrSource: "default" });
    expect(resolveProfile({ maxHr: 20, ftp: 5000, restHr: 500 }, [])).toMatchObject({ maxHr: 190, restHr: 60, ftp: undefined });
  });
});

describe("fitness, fatigue and form", () => {
  it("converges on the daily load when it never changes", () => {
    const first = dayNumber("2026-01-01");
    const today = first + 400;
    const loads = new Map<number, number>();
    for (let d = first; d <= today; d++) loads.set(d, 50);
    const last = loadSeries(loads, first, today).at(-1)!;
    expect(last.fitness).toBeCloseTo(50, 1);
    expect(last.fatigue).toBeCloseTo(50, 3);
    expect(last.form).toBeCloseTo(0, 1);
  });

  it("follows the 42 and 7 day time constants after a single ride", () => {
    const first = dayNumber("2026-01-01");
    const series = loadSeries(new Map([[first, 100]]), first, first + 42);
    // Day one: the ride enters both averages.
    expect(series[0].fitness).toBeCloseTo(100 * (1 - Math.exp(-1 / 42)), 9);
    expect(series[0].fatigue).toBeCloseTo(100 * (1 - Math.exp(-1 / 7)), 9);
    expect(series[0].form).toBe(0); // form looks at yesterday
    // After one time constant each has decayed to 1/e of its day-one value.
    expect(series[42].fitness / series[0].fitness).toBeCloseTo(Math.exp(-1), 6);
    expect(series[7].fatigue / series[0].fatigue).toBeCloseTo(Math.exp(-1), 6);
    // The day after a hard ride you are tired: form is negative.
    expect(series[1].form).toBeLessThan(0);
    // Weeks later the fatigue has gone and what is left is fitness.
    expect(series[30].form).toBeGreaterThan(0);
  });

  it("goes negative during a hard block and recovers with rest", () => {
    const first = dayNumber("2026-01-01");
    const loads = new Map<number, number>();
    for (let d = first; d < first + 60; d++) loads.set(d, 40);
    for (let d = first + 60; d < first + 74; d++) loads.set(d, 120); // two big weeks
    const series = loadSeries(loads, first, first + 90);
    expect(series[74].form).toBeLessThan(-25);
    expect(series[90].form).toBeGreaterThan(series[74].form + 30);
  });
});

describe("analysis", () => {
  it("handles no rides at all", () => {
    const a = analyzeRides([], {}, TODAY);
    expect(a.rideCount).toBe(0);
    expect(a.weeks).toHaveLength(12);
    expect(a.load.series).toHaveLength(0);
    expect(a.intensity.basis).toBe("none");
    expect(a.consistency.daysSinceLastRide).toBeNull();
    expect(a.efforts).toHaveLength(0);
  });

  it("buckets rides into Monday-start weeks and totals them", () => {
    const rides = [
      ride("2026-11-09", { movingSec: 3600, distanceM: 30_000, climbM: 200 }), // Monday this week
      ride("2026-11-11", { movingSec: 5400, distanceM: 40_000, climbM: 500 }),
      ride("2026-11-08", { movingSec: 7200, distanceM: 60_000, climbM: 900 }), // Sunday: last week
      ride("2026-11-02", { movingSec: 1800, distanceM: 10_000, climbM: 50 }), // Monday last week
    ];
    const a = analyzeRides(rides, {}, TODAY);
    const current = a.weeks.at(-1)!;
    const last = a.weeks.at(-2)!;
    expect(current).toMatchObject({ weekStart: "2026-11-09", rides: 2, distanceM: 70_000, climbM: 700, current: true });
    expect(current.hours).toBeCloseTo(2.5, 9);
    expect(last).toMatchObject({ weekStart: "2026-11-02", rides: 2, distanceM: 70_000, longestSec: 7200, current: false });
    expect(a.last28.rides).toBe(4);
    expect(a.last28.hours).toBeCloseTo(5, 9);
    expect(a.consistency.daysSinceLastRide).toBe(1);
  });

  it("ignores rides dated in the future and non-rides", () => {
    const a = analyzeRides([ride("2026-12-25"), ride(ago(2), { kind: "other" }), ride(ago(1))], {}, TODAY);
    expect(a.rideCount).toBe(1);
  });

  it("measures consistency over the last six complete weeks", () => {
    // Rode Tue/Thu/Sat every week except two.
    const rides = steadyWeeks(8, [1, 3, 5]).filter((r) => {
      const w = (weekStartOf(dayNumber(TODAY)) - weekStartOf(dayNumber(r.start))) / 7;
      return w !== 2 && w !== 3;
    });
    const a = analyzeRides(rides, {}, TODAY);
    expect(a.consistency.weeksRidden).toBe(4);
    expect(a.consistency.weeksConsidered).toBe(6);
    expect(a.consistency.ridesPerWeek).toBeCloseTo(2, 9);
    expect(a.consistency.longestGapDays).toBeGreaterThanOrEqual(15);
    expect(a.consistency.usualDays.slice(0, 3).sort()).toEqual([1, 3, 5]);
    expect(a.consistency.calendar).toHaveLength(56);
    expect(a.consistency.calendar.at(-1)!.day).toBe("2026-11-15");
  });

  it("splits intensity by true time in zone when rides carry heart rate histograms", () => {
    const hist: number[] = new Array(200).fill(0);
    hist[130] = 2700; // 72% of 180: easy
    hist[153] = 600; // 85%: moderate
    hist[168] = 300; // 93%: hard
    const rides = steadyWeeks(4, [1, 3, 5], { hrHist: hist, avgHr: 138, maxHr: 170 });
    const a = analyzeRides(rides, { maxHr: 180 }, TODAY);
    expect(a.intensity.basis).toBe("time-in-zone");
    expect(a.intensity.signal).toBe("hr");
    expect(a.intensity.easyPct).toBeCloseTo(75, 6);
    expect(a.intensity.moderatePct).toBeCloseTo(100 / 6, 6);
    expect(a.intensity.hardPct).toBeCloseTo(100 / 12, 6);
    expect(a.intensity.easyPct + a.intensity.moderatePct + a.intensity.hardPct).toBeCloseTo(100, 9);
  });

  it("falls back to one band per ride for summary-only rides, and says so", () => {
    const rides = [
      ...steadyWeeks(4, [1], { avgHr: 120, maxHr: 150 }), // 67% of 180: easy
      ...steadyWeeks(4, [3], { avgHr: 140, maxHr: 165 }), // 78%: moderate
      ...steadyWeeks(4, [5], { avgHr: 155, maxHr: 176, movingSec: 7200 }), // 86%: hard, twice as long
    ];
    const a = analyzeRides(rides, { maxHr: 180 }, TODAY);
    expect(a.intensity.basis).toBe("by-ride");
    expect(a.intensity.hardPct).toBeGreaterThan(a.intensity.easyPct);
    expect(Math.round(a.intensity.easyPct + a.intensity.moderatePct + a.intensity.hardPct)).toBe(100);
  });

  it("reports no intensity split when rides have neither heart rate nor power", () => {
    const a = analyzeRides(steadyWeeks(4, [1, 3, 5]), {}, TODAY);
    expect(a.intensity.basis).toBe("none");
    expect(a.load.method).toBe("duration");
  });

  it("uses power zones when an FTP is set and files carry power", () => {
    const powerHist: number[] = new Array(40).fill(0);
    powerHist[15] = 3000; // 155 W, 62% of 250: easy
    powerHist[27] = 600; // 275 W, 110%: hard
    const rides = steadyWeeks(4, [1, 3, 5], { powerHist, normPower: 190, avgPower: 175, powerMeasured: true });
    const a = analyzeRides(rides, { ftp: 250 }, TODAY);
    expect(a.intensity).toMatchObject({ basis: "time-in-zone", signal: "power" });
    expect(a.intensity.hardPct).toBeCloseTo((600 / 3600) * 100, 6);
    expect(a.load.method).toBe("power");
  });

  it("tracks cadence between the last four weeks and the four before", () => {
    const thisWeek = weekStartOf(dayNumber(TODAY));
    const rides: CoachRide[] = [];
    for (let w = 0; w < 8; w++) {
      rides.push(ride(dayKey(thisWeek - w * 7), { avgCadence: w < 4 ? 88 : 80 }));
    }
    const a = analyzeRides(rides, {}, TODAY);
    expect(a.cadence.recent).toBeCloseTo(88, 6);
    expect(a.cadence.previous).toBeCloseTo(80, 6);
    expect(a.cadence.trend).toBe("up");
  });

  it("flags short histories as still warming up", () => {
    expect(analyzeRides([ride(ago(10)), ride(ago(3))], {}, TODAY).load.warmingUp).toBe(true);
    expect(analyzeRides(steadyWeeks(10, [1, 3, 5]), {}, TODAY).load.warmingUp).toBe(false);
  });

  it("lists notable efforts from the last six weeks only", () => {
    const rides = [
      ride(ago(60), { movingSec: 30_000, name: "Too old to count" }),
      ride(ago(10), { movingSec: 14_400, distanceM: 100_000, climbM: 1800, name: "Big one" }),
      ride(ago(5), { movingSec: 3600, distanceM: 36_000, climbM: 100, name: "Fast one" }),
      ride(ago(2), { movingSec: 3000, peaks: { m20: 262 }, name: "Test day" }),
    ];
    const a = analyzeRides(rides, {}, TODAY);
    const byLabel = Object.fromEntries(a.efforts.map((e) => [e.label, e]));
    expect(byLabel["Longest ride"].rideName).toBe("Big one");
    expect(byLabel["Longest ride"].value).toBe("4 h 00 min");
    expect(byLabel["Most climbing"].value).toBe("5,906 ft");
    expect(byLabel["Best 20 minutes"].value).toBe("262 W");
    expect(byLabel["Fastest ride over 30 km"].rideName).toBe("Fast one");
    expect(a.efforts.some((e) => e.rideName === "Too old to count")).toBe(false);
  });

  it("does not mutate its input", () => {
    const rides = steadyWeeks(3, [1, 5]);
    const copy = JSON.stringify(rides);
    analyzeRides(rides, { maxHr: 185 }, TODAY);
    expect(JSON.stringify(rides)).toBe(copy);
  });
});

describe("the rules-based read", () => {
  const read = (rides: CoachRide[], profile: RiderProfile = {}) => rulesRead(analyzeRides(rides, profile, TODAY));

  it("starts a new rider on the habit, not on fitness", () => {
    const r = read([ride(ago(3))]);
    expect(r.source).toBe("rules");
    expect(r.focus.title).toBe("Three rides this week");
    expect(r.week.filter((d) => d.kind !== "rest")).toHaveLength(3);
  });

  it("prescribes recovery when form is deeply negative", () => {
    const rides = [
      ...steadyWeeks(10, [1, 3, 5], { avgHr: 135, maxHr: 170 }),
      // then a brutal ten days
      ...Array.from({ length: 10 }, (_, i) => ride(ago(i), { movingSec: 4 * 3600, avgHr: 160, maxHr: 182 })),
    ];
    const a = analyzeRides(rides, { maxHr: 185 }, TODAY);
    expect(a.load.form).toBeLessThan(-25);
    const r = rulesRead(a);
    expect(r.focus.title).toBe("Back off and absorb");
    expect(r.week.every((d) => d.kind === "rest" || d.kind === "easy" || d.kind === "long")).toBe(true);
    const planned = r.week.reduce((s, d) => s + d.minutes, 0) / 60;
    expect(planned).toBeLessThan((a.last28.hours / 4) * 0.75);
  });

  it("puts consistency first when weeks are being missed", () => {
    const rides = steadyWeeks(8, [5], { avgHr: 140, maxHr: 175 }).filter((_, i) => i % 2 === 0);
    const r = read(rides, { maxHr: 185 });
    expect(r.focus.title).toBe("Show up three times a week");
    expect(r.focus.observe).toMatch(/of the last 6 weeks/);
  });

  it("tells a rider who goes medium-hard every day to slow down", () => {
    const rides = steadyWeeks(8, [1, 2, 3, 5], { avgHr: 150, maxHr: 178 }); // 81% of 185 every ride
    const a = analyzeRides(rides, { maxHr: 185 }, TODAY);
    expect(a.intensity.moderatePct + a.intensity.hardPct).toBeGreaterThan(90);
    const r = rulesRead(a);
    expect(r.focus.title).toBe("Make your easy days easy");
    expect(r.week.filter((d) => d.kind === "hard")).toHaveLength(1);
    expect(r.caveats.join(" ")).toMatch(/each ride's average/);
  });

  it("does not call a steady rider's riding hard just because their true max never shows", () => {
    // Every ride averages 150 and peaks at 156. With no max entered, the
    // highest heart rate seen is 156, and against that everything looks hard.
    const rides = steadyWeeks(8, [1, 2, 3, 5], { avgHr: 150, maxHr: 156, avgCadence: 88 });
    const a = analyzeRides(rides, {}, TODAY);
    expect(a.profile).toMatchObject({ maxHr: 156, maxHrSource: "observed", maxHrTrusted: false });
    expect(a.intensity.hardPct).toBeGreaterThan(90); // the raw split is still reported
    const r = rulesRead(a);
    expect(r.focus.title).not.toBe("Make your easy days easy");
    expect(r.goingWell.join(" ")).not.toMatch(/mix is healthy/);
    expect(r.caveats.join(" ")).toMatch(/probably not your true maximum/);
    // The same rides with a real maximum entered do get judged.
    const judged = rulesRead(analyzeRides(rides, { maxHr: 185 }, TODAY));
    expect(judged.focus.title).toBe("Make your easy days easy");
  });

  it("trusts an observed max that sits well clear of the usual riding heart rate", () => {
    const rides = [
      ...steadyWeeks(8, [1, 3], { avgHr: 128, maxHr: 150 }),
      ...steadyWeeks(8, [5], { avgHr: 142, maxHr: 181 }),
    ];
    expect(analyzeRides(rides, {}, TODAY).profile).toMatchObject({ maxHr: 181, maxHrSource: "observed", maxHrTrusted: true });
    expect(analyzeRides([], {}, TODAY).profile.maxHrTrusted).toBe(false);
    expect(analyzeRides(rides, { maxHr: 190 }, TODAY).profile.maxHrTrusted).toBe(true);
  });

  it("adds intensity to an all-easy but consistent rider", () => {
    const rides = steadyWeeks(8, [1, 3, 5, 6], { avgHr: 118, maxHr: 150, avgCadence: 88 });
    const r = read(rides, { maxHr: 185 });
    expect(r.focus.title).toBe("Add one hard session");
    expect(r.goingWell.join(" ")).toMatch(/every one of the last 6 weeks/);
  });

  it("works on cadence for a grinder", () => {
    const hist: number[] = new Array(200).fill(0);
    hist[128] = 3000;
    hist[170] = 600; // enough hard time that intensity is not the issue
    const rides = steadyWeeks(8, [1, 3, 5], { hrHist: hist, avgHr: 135, maxHr: 172, avgCadence: 71 });
    const r = read(rides, { maxHr: 185 });
    expect(r.focus.title).toBe("Raise your cadence");
    expect(r.week.some((d) => d.kind === "skills")).toBe(true);
  });

  it("says to hold after a spike week", () => {
    const thisWeek = weekStartOf(dayNumber(TODAY));
    const rides = steadyWeeks(8, [1, 3, 5], { avgHr: 130, maxHr: 165, avgCadence: 88 }).map((r) => {
      const w = (thisWeek - weekStartOf(dayNumber(r.start))) / 7;
      return w === 1 ? { ...r, movingSec: 3 * 3600 } : r; // last week tripled
    });
    const a = analyzeRides(rides, { maxHr: 185 }, TODAY);
    // Not deep enough in the hole for "recover", but clearly a spike.
    if (a.load.form > -25 && a.load.ramp <= 8) expect(rulesRead(a).focus.title).toBe("Hold steady");
    else expect(rulesRead(a).focus.title).toBe("Back off and absorb");
  });

  it("always returns a complete seven-day week on the rider's usual days", () => {
    const rides = steadyWeeks(8, [2, 4, 6], { avgHr: 130, maxHr: 170, avgCadence: 88 });
    const a = analyzeRides(rides, { maxHr: 185 }, TODAY);
    const week = buildWeek("build", a);
    expect(week.map((d) => d.day)).toEqual(["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"]);
    expect(week[6].kind).toBe("long"); // they ride Sundays, so the long ride goes there
    for (const d of week) {
      expect(d.title.length).toBeGreaterThan(0);
      expect(d.detail.length).toBeGreaterThan(0);
      if (d.kind === "rest") expect(d.minutes).toBe(0);
      else expect(d.minutes).toBeGreaterThanOrEqual(20);
    }
    const hard = week.findIndex((d) => d.kind === "tempo" || d.kind === "hard");
    if (hard >= 0) expect(Math.abs(hard - 6)).toBeGreaterThan(1);
  });

  it("is deterministic", () => {
    const rides = sampleRides(TODAY);
    expect(JSON.stringify(read(rides))).toBe(JSON.stringify(read(rides)));
  });

  it("ties in the latest bike fit session", () => {
    const a = analyzeRides(sampleRides(TODAY), {}, TODAY);
    const withOpen = rulesRead(a, {
      sessionId: "s",
      createdAt: "2026-11-03T18:00:00.000Z",
      style: "gravel",
      headline: "One change: raise your saddle 5 mm.",
      openChange: "Raise your saddle 5 mm",
      findings: [],
    });
    expect(withOpen.fitNote).toMatch(/raise your saddle 5 mm/);
    expect(withOpen.fitNote).toMatch(/re-shoot/);
    const clean = rulesRead(a, { sessionId: "s", createdAt: "2026-11-03T18:00:00.000Z", style: "gravel", headline: "", openChange: null, findings: [] });
    expect(clean.fitNote).toMatch(/nothing to change/);
    expect(rulesRead(a).fitNote).toBeUndefined();
  });
});

describe("sample rider", () => {
  const rides = sampleRides(TODAY);
  it("is the same every time for a given day, and ends on that day or before", () => {
    expect(sampleRides(TODAY)).toEqual(rides);
    expect(rides.length).toBeGreaterThan(35);
    expect(rides.every((r) => r.start.slice(0, 10) <= TODAY)).toBe(true);
    expect(new Set(rides.map((r) => r.id)).size).toBe(rides.length);
  });
  it("gives the coach something specific to say", () => {
    const a = analyzeRides(rides, {}, TODAY);
    expect(a.load.method).toBe("hr");
    expect(a.load.warmingUp).toBe(false);
    expect(a.cadence.recent!).toBeLessThan(78);
    const r = rulesRead(a);
    expect(r.goingWell.length).toBeGreaterThan(0);
    expect(r.week).toHaveLength(7);
  });
});
